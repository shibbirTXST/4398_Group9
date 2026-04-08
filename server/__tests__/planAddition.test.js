const request = require('supertest');
const app = require('../app');

// test cases
describe('Plan Addition API (POST /api/habits/plans)', () => {

  // test case 1: correct path
  it('should save the plan and return success when the user is logged in', async () => {
    const newPlan = {
      name: 'Morning Routine'
    };

    const response = await request(app)
      .post('/api/habits/plans')
      .set('Authorization', 'Bearer valid-firebase-token') // triggers the "yes" path
      .send(newPlan);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Plan successfully created'); // validates "return" state
    expect(response.body.plan).toHaveProperty('id'); // validates class attributes
    expect(response.body.plan.name).toBe('Morning Routine');
    });

  // test case 2: error handling
  it('should return an error when the user is not logged in', async () => {
    const newPlan = {
      name: 'Morning Routine'
    };

    const response = await request(app)
      .post('/api/habits/plans')
      .send(newPlan);

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('Error Message');
    });

  // test case 3: input validation
  it('should return 400 Bad Request if the plan name is missing', async () => {
    const incompletePlan = {
      // intentionally leaving out name
    };

    const response = await request(app)
      .post('/api/habits/plans')
      .set('Authorization', 'Bearer valid-firebase-token')
      .send(incompletePlan);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Error Message');
    });

  //test case 4: not logged in and empty name
  it('should return an error when the user is not logged in and the plan name is missing', async () => {
    const incompletePlan = {
        // intentionally leaving out name
    };

    const response = await request(app)
        .post('/api/habits/plans')
        .send(incompletePlan);
    expect(response.status).toBe(401);
    expect(response.body.error).toContain('Error Message');
    });

});