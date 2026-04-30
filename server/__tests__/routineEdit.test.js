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
      update: jest.fn(),
    },
  },
}));

// Import modules AFTER mocks are defined
const db = (await import('../db/db.js')).default;
const { default: app } = await import('../app.js');

// test cases
describe('Routine Edit API (POST /api/habits/routines)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress expected console.error logs for 400/401/404 errors
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

    // test case 1: correct path
    it('should update the routine and return success when the user is logged in', async () => {
    const routineID = 1;
    const updatedTitle = 'Updated Routine Name';

    // Mock DB to simulate finding and updating the routine
    db.routine.findFirst.mockResolvedValue({ routineId: 1, userId: 1 });
    db.routine.update.mockResolvedValue({ routineId: 1, routineName: updatedTitle });

    const response = await request(app)
        .put(`/api/habits/routines/${routineID}`)
        .set('Authorization', 'Bearer valid-firebase-token') // triggers the "yes" path
        .send({ title: updatedTitle });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Routine successfully updated');
    expect(response.body.routine).toBeDefined();
    expect(String(response.body.routine.ID)).toEqual(String(routineID));
    expect(response.body.routine.title).toBe(updatedTitle);
    });

    // test case 2: error handling - routine not found
    it('should return 404 Not Found if the routine does not exist', async () => {
    const nonExistentRoutineId = 9999;
    const updatedTitle = 'Updated Routine Name';

    // Mock DB to simulate routine not existing
    db.routine.findFirst.mockResolvedValue(null);

    const response = await request(app)
        .put(`/api/habits/routines/${nonExistentRoutineId}`)
        .set('Authorization', 'Bearer valid-firebase-token')
        .send({ title: updatedTitle });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Routine not found');
    });

    //test case 3: error handling - invalid routine ID format
    it('should return an error if the routine ID format is invalid', async () => {
        const invalidRoutineId = 'invalid-id';
        const updatedTitle = 'Updated Routine Name';

        const response = await request(app)
            .put(`/api/habits/routines/${invalidRoutineId}`)
            .set('Authorization', 'Bearer valid-firebase-token')
            .send({ title: updatedTitle });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Error Message Return:');
    });

    //test case 4: error handling - missing title in request body
    it('should return an error if the title is missing in the request body', async () => {
    const routineId = 1;

    const response = await request(app)
        .put(`/api/habits/routines/${routineId}`)
        .set('Authorization', 'Bearer valid-firebase-token')
        .send({}); // no title provided

    expect(response.status).toBe(400); // assuming the server returns 400 Bad Request for missing fields
    expect(response.body.error).toBeDefined(); // assuming the server returns this error message
    });

    // test case 5: error handling - user not logged in
    it('should block the update operation and return an error if the user is not logged in', async () => {
    const routineId = 1;
    const updatedTitle = 'Updated Routine Name';

    const response = await request(app)
        .put(`/api/habits/routines/${routineId}`)
        // intentionally trigger the "No" path by NOT setting the Authorization header
        .send({ title: updatedTitle });

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined(); // validates "Error Message Return" state
  });

    //test case 6: error handling - user not logged in and missing title
    it('should return an error when the user is not logged in and the title is missing in the request body', async () => {
    const routineId = 1;

    const response = await request(app)
        .put(`/api/habits/routines/${routineId}`)
        // intentionally trigger the "No" path by NOT setting the Authorization header
        .send({}); // no title provided

    expect(response.status).toBe(401); // assuming the server prioritizes authentication check before request body validation
    expect(response.body.error).toBeDefined(); // assuming the server returns this error message for unauthenticated access

    });

    //test case 7: error handling - user not logged in and invalid routine ID
    it('should return an error when the user is not logged in and the routine ID format is invalid', async () => {
    const invalidRoutineId = 'invalid-id';
    const updatedTitle = 'Updated Routine Name';

    const response = await request(app)
        .put(`/api/habits/routines/${invalidRoutineId}`)
        // intentionally trigger the "No" path by NOT setting the Authorization header
        .send({ title: updatedTitle });

    expect(response.status).toBe(401); // assuming the server prioritizes authentication check before ID format validation
    expect(response.body.error).toBeDefined(); // assuming the server returns this error message for unauthenticated access
    });

    //test case 8: error handling - user not logged in and routine not found
    it('should return an error when the user is not logged in and the routine does not exist', async () => {
    const nonExistentRoutineId = 9999;
    const updatedTitle = 'Updated Routine Name';

    const response = await request(app)
        .put(`/api/habits/routines/${nonExistentRoutineId}`)
        // intentionally trigger the "No" path by NOT setting the Authorization header
        .send({ title: updatedTitle });

    expect(response.status).toBe(401); // assuming the server prioritizes authentication check before existence validation
    expect(response.body.error).toBeDefined(); // assuming the server returns this error message for unauthenticated access
    });
});