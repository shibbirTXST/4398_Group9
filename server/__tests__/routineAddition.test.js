import request from 'supertest';
import { jest } from '@jest/globals';

// Mock Firebase Auth
jest.unstable_mockModule('../firebaseAdmin.js', () => ({
  default: {
    auth: () => ({
      verifyIdToken: jest.fn().mockResolvedValue({
        uid: 'test-uid',
        email: 'user@test.com',
      }),
    }),
  },
}));

// Mock User Resolver
jest.unstable_mockModule('../utils/resolveUser.js', () => ({
  findUserByFirebaseUid: jest.fn().mockResolvedValue({ userId: 1, firebaseUid: 'test-uid' }),
  upsertUserFromDecodedToken: jest.fn().mockResolvedValue({ userId: 1, firebaseUid: 'test-uid' }),
}));

// Mock Database dynamically to support both specific and default titles
jest.unstable_mockModule('../db/db.js', () => ({
  default: {
    routine: {
      create: jest.fn().mockImplementation((args) => {
        return Promise.resolve({
          routineId: 1, 
          routineName: args.data.routineName || 'New Routine',
        });
      }),
    },
  },
}));

// Import app AFTER mocks are defined
const { default: app } = await import('../app.js');

describe('Routine Addition API (POST /api/habits/routines)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // test case 1: Correct path with title
  it('should save the routine and return success when the user is logged in', async () => {
    const newRoutine = { title: 'Morning Routine' };

    const response = await request(app)
      .post('/api/habits/routines')
      .set('Authorization', 'Bearer valid-firebase-token')
      .send(newRoutine);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Routine successfully created'); 
    // Match the DTO transformation: ID (string) and title
    expect(response.body.routine).toHaveProperty('ID'); 
    expect(response.body.routine.title).toBe('Morning Routine');
  });

  // test case 2: Error handling - Not logged in
  it('should return an error when the user is not logged in', async () => {
    const response = await request(app)
      .post('/api/habits/routines')
      .send({ title: 'Morning Routine' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
  });

  // test case 3: Input validation - Missing title (Controller defaults to 'New Routine')
  it('should return 201 even if the routine title is missing', async () => {
    const response = await request(app)
      .post('/api/habits/routines')
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({}); // intentionally leaving out title

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Routine successfully created');
    // Ensure it uses the default title set in the controller
    expect(response.body.routine.title).toBe('New Routine');
  });

  // test case 4: Error handling - Not logged in and empty name
  it('should return 401 even if title is missing if the user is not logged in', async () => {
    const response = await request(app)
        .post('/api/habits/routines')
        .send({});
    
    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
  });
});