const request = require('supertest');
const app = require('../app');

// test cases
//delete habit test cases
describe('Habit Deletion API (DELETE /api/habits/:id)', () => {

  // test case 1: correct path
  it('should delete the habit and return success when the user is logged in', async () => {
    const habitID = 1;

    const response = await request(app)
      .delete(`/api/habits/${habitID}`)
      .set('Authorization', 'Bearer valid-firebase-token') // triggers the "yes" path
      .send();

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Habit deleted');
    expect(response.body.habitID).toEqual(habitID); // validates that the correct habit was deleted
  });

  //test case 2: error handling - habit not found
  it('should return 404 Not Found if the habit does not exist', async () => {
  const nonExistentHabitID = 9999;

  const response = await request(app)
    .delete(`/api/habits/${nonExistentHabitID}`)
    .set('Authorization', 'Bearer valid-firebase-token');

  expect(response.status).toBe(404);
  expect(response.body.message).toBe('Habit not found');
  });

  // test case 3: error handling - user not logged in
  it('should block the delete operation and return an error if the user is not logged in', async () => {
    const habitID = 1;

    const response = await request(app)
      .delete(`/api/habits/${habitID}`)
      // intentionally trigger the "No" path by NOT setting the Authorization header
      .send();

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('Error Message'); // validates "Error Message Return" state
  });

  // test case 4: error handling - invalid habit ID
  it('should return an error if the habit ID is invalid', async () => {
    const invalidHabitID = 'invalid-id';

    const response = await request(app)
      .delete(`/api/habits/${invalidHabitID}`)
      .set('Authorization', 'Bearer valid-firebase-token')
      .send();

    expect(response.status).toBe(400); // assuming the server returns 400 Bad Request for invalid IDs
    expect(response.body.error).toContain('Error Message'); // assuming the server returns this error message
  });
});