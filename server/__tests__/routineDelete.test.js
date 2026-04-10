const request = require('supertest');
const app = require('../app');

// test cases
describe('Routine Delete API (POST /api/habits/routines)', () => {

  // test case 1: correct path
  it('should delete the routine (and all associated habits) and return success when the user is logged in', async () => {
    const routineID = 1;

    const response = await request(app)
      .delete(`/api/habits/routines/${routineID}`)
      .set('Authorization', 'Bearer valid-firebase-token') // triggers the "yes" path
      .send();

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Routine deleted'); // validates "return" state
    expect(response.body.routineID).toEqual(routineID); // validates the correct routine was deleted
    expect(response.body.hasHabits).toEqual(false); // validates that associated habits were also deleted
  });
    
  //test case 2: error handling - routine not found
    it('should return error if the routine does not exist', async () => {
    const nonExistentRoutineId = 9999;

    const response = await request(app)
      .delete(`/api/habits/routines/${nonExistentRoutineId}`)
      .set('Authorization', 'Bearer valid-firebase-token');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Routine not found');
  });

  //test case 3: invalid routine ID format
  it('should return an error if the routine ID format is invalid', async () => {
    const invalidRoutineId = 'invalid-id';

    const response = await request(app)
      .delete(`/api/habits/routines/${invalidRoutineId}`)
      .set('Authorization', 'Bearer valid-firebase-token')
      .send(); 

    expect(response.status).toBe(400); // assuming the server returns 400 Bad Request for invalid IDs
    expect(response.body.error).toContain('Error Message'); // assuming the server returns this error message
  });

    // test case 4: error handling - user not logged in
    it('should block the delete operation and return an error if the user is not logged in', async () => {
    const routineId = 1;

    const response = await request(app)
      .delete(`/api/habits/routines/${routineId}`)
      // intentionally trigger the "No" path by NOT setting the Authorization header
      .send();

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Error Message'); // validates "Error Message Return" state
  });

  //test case 5: error handling - user not logged in and invalid routine ID
  it('should return an error when the user is not logged in and the routine ID format is invalid', async () => {
    const invalidRoutineId = 'invalid-id';

    const response = await request(app)
        .delete(`/api/habits/routines/${invalidRoutineId}`)
        // intentionally trigger the "No" path by NOT setting the Authorization header
        .send();

    expect(response.status).toBe(401); // assuming the server prioritizes authentication check before ID format validation
    expect(response.body.error).toContain('Error Message'); // assuming the server returns this error message for unauthenticated access
  });

  //test case 6: error handling - user not logged in and routine not found
  it('should return an error when the user is not logged in and the routine does not exist', async () => {
    const nonExistentRoutineId = 9999;

    const response = await request(app)
        .delete(`/api/habits/routines/${nonExistentRoutineId}`)
        // intentionally trigger the "No" path by NOT setting the Authorization header
        .send();

    expect(response.status).toBe(401); // assuming the server prioritizes authentication check before existence validation
    expect(response.body.error).toContain('Error Message'); // assuming the server returns this error message for unauthenticated access
  });
});