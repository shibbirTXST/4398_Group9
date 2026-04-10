const request = require('supertest');
const app = require('../app');
const e = require('express');

// test cases
describe('Habit Modification API (PUT /api/habits/:id)', () => {
  // test case 1: correct path
  it('should update the habit and return the updated habit when the user is logged in', async () => {
    const habitID = 2;
    const updatedTitle = 'Read for 1 hour';
    const updatedReminderTime = '20:00';
    const RoutineID = 1;

    const response = await request(app)
      .put(`/api/habits/${habitID}`)
      .set('Authorization', 'Bearer valid-firebase-token') // triggers the "yes" path
      .send({ title: updatedTitle, reminderTime: updatedReminderTime, routineID: RoutineID });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('habit');
    expect(response.body.habit.ID).toEqual(habitID);
    expect(response.body.habit.title).toBe(updatedTitle);
    expect(response.body.habit.reminderTime).toBe(updatedReminderTime);
    expect(response.body.habit.routineID).toBe(RoutineID);
  });
  
  // test case 2: error handling - habit not found
  it('should return 404 Not Found if the habit does not exist', async () => {
    const nonExistentHabitID = 9999;
    const updatedTitle = 'Some Title';
    const updatedReminderTime = '20:00';
    const RoutineID = 1;

    const response = await request(app)
      .put(`/api/habits/${nonExistentHabitID}`)
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({ title: updatedTitle, reminderTime: updatedReminderTime, routineID: RoutineID });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Habit not found');
  });
  
  // test case 3: error handling - user not logged in
  it('should block the update operation and return an error if the user is not logged in', async () => {
    const habitID = 2;
    const updatedTitle = 'Read for 1 hour';
    const updatedReminderTime = '20:00';
    const RoutineID = 1;

    const response = await request(app)
      .put(`/api/habits/${habitID}`)
      // intentionally trigger the "No" path by NOT setting the Authorization header
      .send({ title: updatedTitle, reminderTime: updatedReminderTime, routineID: RoutineID });

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('Error Message'); // validates "Error Message Return" state
  });

  // test case 4: error handling - missing title in request body
  it('should return an error if the title is missing in the request body', async () => {
    const habitID = 2;
    const updatedReminderTime = '20:00';
    const RoutineID = 1;


    const response = await request(app)
      .put(`/api/habits/${habitID}`)
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({ reminderTime: updatedReminderTime, routineID: RoutineID }); // no title provided

    expect(response.status).toBe(400); // assuming the server returns 400 Bad Request for missing fields
    expect(response.body.error).toContain('Error Message'); // assuming the server returns this error message
  });

  //test case 5: error handling - missing reminder time in request body
  it('should return an error if the reminder time is missing in the request body', async () => {
    const habitID = 2;
    const updatedTitle = 'Read for 1 hour';
    const RoutineID = 1;

    const response = await request(app)
      .put(`/api/habits/${habitID}`)
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({ title: updatedTitle, routineID: RoutineID }); // no reminder time provided

    expect(response.status).toBe(400); // assuming the server returns 400 Bad Request for missing fields
    expect(response.body.error).toContain('Error Message'); // assuming the server returns this error message
  });

  //test case 6: error handling - missing routine ID in request body
  it('should return an error if the routine ID is missing in the request body', async () => {
    const habitID = 2;
    const updatedTitle = 'Read for 1 hour';
    const updatedReminderTime = '20:00';

    const response = await request(app)
      .put(`/api/habits/${habitID}`)
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({ title: updatedTitle, reminderTime: updatedReminderTime }); // no routine ID provided

    expect(response.status).toBe(400); // assuming the server returns 400 Bad Request for missing fields
    expect(response.body.error).toContain('Error Message'); // assuming the server returns this error message
  });

  //test case 7: error handling - invalid routine ID in request body
  it('should return an error if the routine ID is invalid in the request body', async () => {
    const habitID = 2;
    const updatedTitle = 'Read for 1 hour';
    const updatedReminderTime = '20:00';
    const invalidRoutineID = 'invalid-routine-id';

    const response = await request(app)
      .put(`/api/habits/${habitID}`)
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({ title: updatedTitle, reminderTime: updatedReminderTime, routineID: invalidRoutineID }); // invalid routine ID provided

    expect(response.status).toBe(400); // assuming the server returns 400 Bad Request for invalid fields
    expect(response.body.error).toContain('Error Message'); // assuming the server returns this error message
  });

  // test case 8: error handling - invalid habit ID
  it('should return an error if the habit ID is invalid', async () => {
    const invalidHabitID = 'invalid-id';
    const updatedTitle = 'Read for 1 hour';
    const updatedReminderTime = '20:00';
    const RoutineID = 1;

    const response = await request(app)
      .put(`/api/habits/${invalidHabitID}`)
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({ title: updatedTitle, reminderTime: updatedReminderTime, routineID: RoutineID });

    expect(response.status).toBe(400); // assuming the server returns 400 Bad Request for invalid IDs
    expect(response.body.error).toContain('Error Message'); // assuming the server returns this error message
  });

  //test case 9: error handling - user not logged in and missing title
  it('should return an error when the user is not logged in and the title is missing in the request body', async () => {
    const habitID = 2;
    const updatedReminderTime = '20:00';
    const RoutineID = 1;

    const response = await request(app)
      .put(`/api/habits/${habitID}`)
      // intentionally trigger the "No" path by NOT setting the Authorization header
      .send({ reminderTime: updatedReminderTime, routineID: RoutineID }); // no title provided

    expect(response.status).toBe(401); // assuming the server prioritizes authentication check before input validation
    expect(response.body.error).toContain('Error Message'); // assuming the server returns this error message for unauthenticated access
  });

  //test case 10: missing fields and logged out
  it('should return an error when the user is not logged in and required fields are missing in the request body', async () => {
    const habitID = 2;

    const response = await request(app)
      .put(`/api/habits/${habitID}`)
      // intentionally trigger the "No" path by NOT setting the Authorization header
      .send(); // no fields provided

    expect(response.status).toBe(401); // assuming the server prioritizes authentication check before input validation
    expect(response.body.error).toContain('Error Message'); // assuming the server returns this error message for unauthenticated access
  });

  //test case 12: error handling - user logged in but missing fields
  it('should return an error when the user is logged in but required fields are missing in the request body', async () => {
    const habitID = 2;
    
    const response = await request(app)
      .put(`/api/habits/${habitID}`)
      .set('Authorization', 'Bearer valid-firebase-token')
      .send(); // no fields provided

    expect(response.status).toBe(400); // assuming the server returns 400 Bad Request for missing fields
    expect(response.body.error).toContain('Error Message'); // assuming the server returns this error message
  });
});