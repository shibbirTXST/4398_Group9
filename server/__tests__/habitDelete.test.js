import request from 'supertest';
import { jest } from '@jest/globals';

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
  findUserByFirebaseUid: jest.fn().mockResolvedValue({ userId: 1 }),
  upsertUserFromDecodedToken: jest.fn().mockResolvedValue({ userId: 1, firebaseUid: 'test-uid' }),
}));

// Mock Database to bypass Prisma TypeScript parsing issues
jest.unstable_mockModule('../db/db.js', () => ({
  default: {
    habit: {
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
    },
    reminder: {
      deleteMany: jest.fn().mockResolvedValue({}),
    },
    routineHabit: {
      deleteMany: jest.fn().mockResolvedValue({}),
    },
  },
}));

// Import modules AFTER mocks are defined
const db = (await import('../db/db.js')).default;
const { default: app } = await import('../app.js');

describe('Habit Deletion API (DELETE /api/habits/:id)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress expected console.error logs for 400/401/404 errors
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // test case 1: correct path
  it('should delete the habit and return success when the user is logged in', async () => {
    // Mock the DB to pretend the habit exists and belongs to the user
    db.habit.findFirst.mockResolvedValue({ habitId: 1, userId: 1 });
    db.habit.deleteMany.mockResolvedValue({ count: 1 });

    const response = await request(app)
      .delete('/api/habits/1')
      .set('Authorization', 'Bearer valid-firebase-token') // triggers the "yes" path
      .send();

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Habit deleted');
  });

  // test case 2: error handling - habit not found
  it('should return 404 Not Found if the habit does not exist', async () => {
    // Mock the DB to return null, simulating a habit that doesn't exist
    db.habit.deleteMany.mockResolvedValue({ count: 0 });

    const response = await request(app)
      .delete('/api/habits/9999')
      .set('Authorization', 'Bearer valid-firebase-token');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Habit not found');
  });

  // test case 3: error handling - user not logged in
  it('should block the delete operation and return an error if the user is not logged in', async () => {
    const response = await request(app)
      .delete('/api/habits/1')
      // intentionally trigger the "No" path by NOT setting the Authorization header
      .send();

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined(); // validates "Error Message Return" state
  });

  // test case 4: error handling - invalid habit ID
  it('should return an error if the habit ID is invalid', async () => {
    const response = await request(app)
      .delete('/api/habits/invalid-id')
      .set('Authorization', 'Bearer valid-firebase-token')
      .send();

    expect(response.status).toBe(400); 
    expect(response.body.error).toBeDefined(); 
  });
});