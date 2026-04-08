const request = require('supertest');
const app = require('../app');

// test cases
describe('Plan Edit API (POST /api/habits/plans)', () => {

    // test case 1: correct path
    it('should update the plan and return success when the user is logged in', async () => {
    const planId = 1;
    const updatedName = 'Updated Plan Name';

    const response = await request(app)
        .put(`/api/habits/plans/${planId}`)
        .set('Authorization', 'Bearer valid-firebase-token') // triggers the "yes" path
        .send({ name: updatedName });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Plan successfully updated');
    expect(response.body.planId).toBe(planId); //ensure correct plan was updated
    
    });

    // test case 2: error handling - plan not found
    it('should return 404 Not Found if the plan does not exist', async () => {
    const nonExistentPlanId = 9999;
    const updatedName = 'Updated Plan Name';

    const response = await request(app)
        .put(`/api/habits/plans/${nonExistentPlanId}`)
        .set('Authorization', 'Bearer valid-firebase-token')
        .send({ name: updatedName });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Plan not found');
    });

    //test case 3: error handling - invalid plan ID format
    it('should return an error if the plan ID format is invalid', async () => {
        const invalidPlanId = 'invalid-id';
        const updatedName = 'Updated Plan Name';

        const response = await request(app)
            .put(`/api/habits/plans/${invalidPlanId}`)
            .set('Authorization', 'Bearer valid-firebase-token')
            .send({ name: updatedName });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid plan ID format');
    });

    //test case 4: error handling - missing name in request body
    it('should return an error if the name is missing in the request body', async () => {
    const planId = 1;

    const response = await request(app)
        .put(`/api/habits/plans/${planId}`)
        .set('Authorization', 'Bearer valid-firebase-token')
        .send({}); // no name provided

    expect(response.status).toBe(400); // assuming the server returns 400 Bad Request for missing fields
    expect(response.body.error).toContain('Error Message'); // assuming the server returns this error message
    });

    // test case 5: error handling - user not logged in
    it('should block the update operation and return an error if the user is not logged in', async () => {
    const planId = 1;
    const updatedName = 'Updated Plan Name';

    const response = await request(app)
        .put(`/api/habits/plans/${planId}`)
        // intentionally trigger the "No" path by NOT setting the Authorization header
        .send({ name: updatedName });

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('Error Message'); // validates "Error Message Return" state
  });

    //test case 6: error handling - user not logged in and missing name
    it('should return an error when the user is not logged in and the name is missing in the request body', async () => {
    const planId = 1;

    const response = await request(app)
        .put(`/api/habits/plans/${planId}`)
        // intentionally trigger the "No" path by NOT setting the Authorization header
        .send({}); // no name provided

    expect(response.status).toBe(401); // assuming the server prioritizes authentication check before request body validation
    expect(response.body.error).toContain('Error Message'); // assuming the server returns this error message for unauthenticated access

    });

    //test case 7: error handling - user not logged in and invalid plan ID
    it('should return an error when the user is not logged in and the plan ID format is invalid', async () => {
    const invalidPlanId = 'invalid-id';
    const updatedName = 'Updated Plan Name';

    const response = await request(app)
        .put(`/api/habits/plans/${invalidPlanId}`)
        // intentionally trigger the "No" path by NOT setting the Authorization header
        .send({ name: updatedName });

    expect(response.status).toBe(401); // assuming the server prioritizes authentication check before ID format validation
    expect(response.body.error).toContain('Error Message'); // assuming the server returns this error message for unauthenticated access
    });

    //test case 8: error handling - user not logged in and plan not found
    it('should return an error when the user is not logged in and the plan does not exist', async () => {
    const nonExistentPlanId = 9999;
    const updatedName = 'Updated Plan Name';

    const response = await request(app)
        .put(`/api/habits/plans/${nonExistentPlanId}`)
        // intentionally trigger the "No" path by NOT setting the Authorization header
        .send({ name: updatedName });

    expect(response.status).toBe(401); // assuming the server prioritizes authentication check before existence validation
    expect(response.body.error).toContain('Error Message'); // assuming the server returns this error message for unauthenticated access
    });
});