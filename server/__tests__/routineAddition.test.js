const request = require('supertest');
const app = require('../app');

// test cases
describe('Routine Addition API (POST /api/habits/routines)', () => {

  // test case 1: correct path
  it('should save the routine and return success when the user is logged in', async () => {
    const newRoutine = {
      title: 'Morning Routine'
    };

    const response = await request(app)
      .post('/api/habits/routines')
      .set('Authorization', 'Bearer valid-firebase-token') // triggers the "yes" path
      .send(newRoutine);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Routine successfully created'); // validates "return" state
    expect(response.body.routine).toHaveProperty('ID'); // validates class attributes
    expect(response.body.routine.title).toBe('Morning Routine');
    });

  // test case 2: error handling
  it('should return an error when the user is not logged in', async () => {
    const newRoutine = {
      title: 'Morning Routine'
    };

    const response = await request(app)
      .post('/api/habits/routines')
      .send(newRoutine);

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('Error Message');
    });

  // test case 3: input validation
  it('should return 400 Bad Request if the routine title is missing', async () => {
    const incompleteRoutine = {
      // intentionally leaving out title
    };

    const response = await request(app)
      .post('/api/habits/routines')
      .set('Authorization', 'Bearer valid-firebase-token')
      .send(incompleteRoutine);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Error Message');
    });

  //test case 4: not logged in and empty name
  it('should return an error when the user is not logged in and the routine title is missing', async () => {
    const incompleteRoutine = {
        // intentionally leaving out title
    };

    const response = await request(app)
        .post('/api/habits/routines')
        .send(incompleteRoutine);
    
    expect(response.status).toBe(401);
    expect(response.body.error).toContain('Error Message');
    });

});