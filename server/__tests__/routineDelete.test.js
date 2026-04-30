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
  findUserByFirebaseUid: jest.fn().mockResolvedValue({ userId: 1 }),
  upsertUserFromDecodedToken: jest.fn().mockResolvedValue({ userId: 1, firebaseUid: 'test-uid' }),
}));

// Mock Database to bypass Prisma TypeScript parsing issues
jest.unstable_mockModule('../db/db.js', () => ({
  default: {
    routine: {
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(), // Just in case routine deletion uses a transaction
  },
}));

// Import modules AFTER mocks are defined
const db = (await import('../db/db.js')).default;
const { default: app } = await import('../app.js');

// test cases
describe('Routine Delete API (DELETE /api/habits/routines/:id)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should delete the routine (and all associated habits) and return success when the user is logged in', async () => {
    const routineID = 1;

    db.routine.findFirst.mockResolvedValue({ routineId: 1, userId: 1 });
    
    // Included findMany in the transaction mock to prevent the 500 error
    db.$transaction.mockImplementation(async (callback) => {
      const tx = {
        routineHabit: { 
          findMany: jest.fn().mockResolvedValue([{ habitId: 10 }]), // Mocking linked habits
          deleteMany: jest.fn().mockResolvedValue({}) 
        },
        habit: { deleteMany: jest.fn().mockResolvedValue({}) },
        routine: { delete: jest.fn().mockResolvedValue({}) },
      };
      return await callback(tx);
    });

    const response = await request(app)
      .delete(`/api/habits/routines/${routineID}`)
      .set('Authorization', 'Bearer valid-firebase-token')
      .send();

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Routine deleted'); 
  });

  it('should return error if the routine does not exist', async () => {
    const nonExistentRoutineId = 9999;
    db.routine.findFirst.mockResolvedValue(null);

    const response = await request(app)
      .delete(`/api/habits/routines/${nonExistentRoutineId}`)
      .set('Authorization', 'Bearer valid-firebase-token');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Routine not found');
  });

  it('should return an error if the routine ID format is invalid', async () => {
    const invalidRoutineId = 'invalid-id';

    const response = await request(app)
      .delete(`/api/habits/routines/${invalidRoutineId}`)
      .set('Authorization', 'Bearer valid-firebase-token')
      .send(); 

    expect(response.status).toBe(400);
    // FIX: Matched exact error message from your controller
    expect(response.body.error).toBe('Error Message Return: Invalid routine ID');
  });

  it('should block the delete operation and return an error if the user is not logged in', async () => {
    const routineId = 1;
    const response = await request(app)
      .delete(`/api/habits/routines/${routineId}`)
      .send();

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
  });

  //test case 5: error handling - user not logged in and invalid routine ID
  it('should return an error when the user is not logged in and the routine ID format is invalid', async () => {
    const invalidRoutineId = 'invalid-id';

    const response = await request(app)
        .delete(`/api/habits/routines/${invalidRoutineId}`)
        // intentionally trigger the "No" path by NOT setting the Authorization header
        .send();

    expect(response.status).toBe(401); // assuming the server prioritizes authentication check before ID format validation
    expect(response.body.error).toBeDefined(); // assuming the server returns this error message for unauthenticated access
  });

  //test case 6: error handling - user not logged in and routine not found
  it('should return an error when the user is not logged in and the routine does not exist', async () => {
    const nonExistentRoutineId = 9999;

    const response = await request(app)
        .delete(`/api/habits/routines/${nonExistentRoutineId}`)
        // intentionally trigger the "No" path by NOT setting the Authorization header
        .send();

    expect(response.status).toBe(401); // assuming the server prioritizes authentication check before existence validation
    expect(response.body.error).toBeDefined(); // assuming the server returns this error message for unauthenticated access
  });
});