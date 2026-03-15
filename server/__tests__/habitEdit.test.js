const request = require('supertest');
const app = require('../app');

// test cases
describe('Habit Modification API (PUT /api/habits/:id)', () => {
  //title update test cases
  // test case 1: correct path
  it('should update the habit and return the updated habit when the user is logged in', async () => {
    const habitId = 2;
    const updatedTitle = 'Read for 1 hour';
    const updatedReminderTime = '20:00';
    const PlanID = 1;

    const response = await request(app)
      .put(`/api/habits/${habitId}`)
      .set('Authorization', 'Bearer valid-firebase-token') // triggers the "yes" path
      .send({ title: updatedTitle, reminderTime: updatedReminderTime, planId: PlanID });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe(updatedTitle);
    expect(response.body.reminderTime).toBe(updatedReminderTime);
    expect(response.body.planId).toBe(PlanID);
  });
  
  // test case 2: error handling - habit not found
  it('should return 404 Not Found if the habit does not exist', async () => {
    const nonExistentHabitId = 9999;
    const updatedTitle = 'Some Title';

    const response = await request(app)
      .put(`/api/habits/${nonExistentHabitId}`)
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({ title: updatedTitle });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Habit not found');
  });
  
  // test case 3: error handling - user not logged in
  it('should block the update operation and return an error if the user is not logged in', async () => {
    const habitId = 2;
    const updatedTitle = 'Read for 1 hour';

    const response = await request(app)
      .put(`/api/habits/${habitId}`)
      // intentionally trigger the "No" path by NOT setting the Authorization header
      .send({ title: updatedTitle });

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('Error Message Return'); // validates "Error Message Return" state
  });

  // test case 4: error handling - missing title in request body
  it('should return an error if the title is missing in the request body', async () => {
    const habitId = 2;

    const response = await request(app)
      .put(`/api/habits/${habitId}`)
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({}); // no title provided

    expect(response.status).toBe(400); // assuming the server returns 400 Bad Request for missing fields
    expect(response.body.error).toContain('Error Message Return'); // assuming the server returns this error message
  });

  //test case 5: error handling - missing reminder time in request body
  it('should return an error if the reminder time is missing in the request body', async () => {
    const habitId = 2;
    const updatedTitle = 'Read for 1 hour';
    const PlanID = 1;

    const response = await request(app)
      .put(`/api/habits/${habitId}`)
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({ title: updatedTitle, planId: PlanID }); // no reminder time provided

    expect(response.status).toBe(400); // assuming the server returns 400 Bad Request for missing fields
    expect(response.body.error).toContain('Error Message Return'); // assuming the server returns this error message
  });

  //test case 6: error handling - missing plan ID in request body
  it('should return an error if the plan ID is missing in the request body', async () => {
    const habitId = 2;
    const updatedTitle = 'Read for 1 hour';
    const updatedReminderTime = '20:00';

    const response = await request(app)
      .put(`/api/habits/${habitId}`)
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({ title: updatedTitle, reminderTime: updatedReminderTime }); // no plan ID provided

    expect(response.status).toBe(400); // assuming the server returns 400 Bad Request for missing fields
    expect(response.body.error).toContain('Error Message Return'); // assuming the server returns this error message
  });

  //test case 7: error handling - invalid plan ID in request body
  it('should return an error if the plan ID is invalid in the request body', async () => {
    const habitId = 2;
    const updatedTitle = 'Read for 1 hour';
    const updatedReminderTime = '20:00';
    const invalidPlanID = 'invalid-plan-id';

    const response = await request(app)
      .put(`/api/habits/${habitId}`)
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({ title: updatedTitle, reminderTime: updatedReminderTime, planId: invalidPlanID }); // invalid plan ID provided

    expect(response.status).toBe(400); // assuming the server returns 400 Bad Request for invalid fields
    expect(response.body.error).toContain('Error Message Return'); // assuming the server returns this error message
  });

  //test case 8: error handling - plan ID not found in the system
  it('should return an error if the plan ID does not exist in the system', async () => {
    const habitId = 2;
    const updatedTitle = 'Read for 1 hour';
    const updatedReminderTime = '20:00';
    const nonExistentPlanID = 9999;

    const response = await request(app)
      .put(`/api/habits/${habitId}`)
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({ title: updatedTitle, reminderTime: updatedReminderTime, planId: nonExistentPlanID }); // non-existent plan ID provided

    expect(response.status).toBe(404); // assuming the server returns 404 Not Found for non-existent related resources
    expect(response.body.message).toBe('Plan not found'); // assuming the server returns this message for non-existent plans
  });

  // test case 9: error handling - invalid habit ID
  it('should return an error if the habit ID is invalid', async () => {
    const invalidHabitId = 'invalid-id';
    const updatedTitle = 'Read for 1 hour';

    const response = await request(app)
      .put(`/api/habits/${invalidHabitId}`)
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({ title: updatedTitle });

    expect(response.status).toBe(400); // assuming the server returns 400 Bad Request for invalid IDs
    expect(response.body.error).toContain('Error Message Return'); // assuming the server returns this error message
  });
});