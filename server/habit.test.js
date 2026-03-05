const request = require('supertest');
const app = require('./index');

// test cases
describe('Habit Addition API (POST /api/habits)', () => {

  // test case 1: correct path
  it('should save the task and return success when the user is logged in', async () => {
    const newTask = {
      taskName: 'Drink Water',
      reminderTime: '08:00 AM',
      accountID: 1,
      planID: 1
    };

    const response = await request(app)
      .post('/api/habits')
      .set('Authorization', 'Bearer valid-firebase-token') // triggers the "yes" path
      .send(newTask);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Task successfully created'); // validates "return" state
    expect(response.body.task).toHaveProperty('taskID'); // validates Class attributes
    expect(response.body.task.taskName).toBe('Drink Water');
    expect(response.body.task.isCompleted).toBe(false);
  });

  // test case 2: error handling
  it('should block the save operation and return an error if the user is not logged in', async () => {
    const newTask = {
      taskName: 'Read a Book',
      reminderTime: '09:00 PM',
      accountID: 2,
      planID: 2
    };

    const response = await request(app)
      .post('/api/habits')
      // Intentionally trigger the "No" path
      .send(newTask);

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('Error Message Return'); // validates "Error Message Return" state
  });

  // test case 3: input validation 
  it('should return 400 Bad Request if the taskName is missing', async () => {
    const incompleteTask = {
      // intentionally leaving out taskName
      reminderTime: '10:00 AM',
      accountID: 1,
      planID: 1
    };

    const response = await request(app)
      .post('/api/habits')
      .set('Authorization', 'Bearer valid-firebase-token') // user IS logged in
      .send(incompleteTask);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Task name is required'); 
  });

});