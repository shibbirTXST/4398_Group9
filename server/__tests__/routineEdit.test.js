const request = require('supertest');
const app = require('../app');

// test cases
describe('Routine Edit API (POST /api/habits/routines)', () => {

    // test case 1: correct path
    it('should update the routine and return success when the user is logged in', async () => {
    const routineID = 1;
    const updatedTitle = 'Updated Routine Name';

    const response = await request(app)
        .put(`/api/habits/routines/${routineID}`)
        .set('Authorization', 'Bearer valid-firebase-token') // triggers the "yes" path
        .send({ title: updatedTitle });

    
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Routine successfully updated');
    expect(response.body.routineID).toEqual(routineID); //ensure correct routine was updated

    });

    // test case 2: error handling - routine not found
    it('should return 404 Not Found if the routine does not exist', async () => {
    const nonExistentRoutineId = 9999;
    const updatedTitle = 'Updated Routine Name';

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
        expect(response.body.error).toBe('Invalid routine ID format');
    });

    //test case 4: error handling - missing title in request body
    it('should return an error if the title is missing in the request body', async () => {
    const routineId = 1;

    const response = await request(app)
        .put(`/api/habits/routines/${routineId}`)
        .set('Authorization', 'Bearer valid-firebase-token')
        .send({}); // no title provided

    expect(response.status).toBe(400); // assuming the server returns 400 Bad Request for missing fields
    expect(response.body.error).toContain('Error Message'); // assuming the server returns this error message
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
    expect(response.body.error).toContain('Error Message'); // validates "Error Message Return" state
  });

    //test case 6: error handling - user not logged in and missing title
    it('should return an error when the user is not logged in and the title is missing in the request body', async () => {
    const routineId = 1;

    const response = await request(app)
        .put(`/api/habits/routines/${routineId}`)
        // intentionally trigger the "No" path by NOT setting the Authorization header
        .send({}); // no title provided

    expect(response.status).toBe(401); // assuming the server prioritizes authentication check before request body validation
    expect(response.body.error).toContain('Error Message'); // assuming the server returns this error message for unauthenticated access

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
    expect(response.body.error).toContain('Error Message'); // assuming the server returns this error message for unauthenticated access
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
    expect(response.body.error).toContain('Error Message'); // assuming the server returns this error message for unauthenticated access
    });
});