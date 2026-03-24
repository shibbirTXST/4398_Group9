const request = require('supertest');
const app = require('../app');

// test cases
//delete habit test cases
describe('Habit Deletion API (DELETE /api/habits/:id)', () => {

  // test case 1: correct path
  it('should delete the habit and return success when the user is logged in', async () => {
    const habitId = 1;

    const response = await request(app)
      .delete(`/api/habits/${habitId}`)
      .set('Authorization', 'Bearer valid-firebase-token') // triggers the "yes" path
      .send();

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Habit deleted');
  });

  //test case 2: error handling - habit not found
  it('should return 404 Not Found if the habit does not exist', async () => {
  const nonExistentHabitId = 9999;

  const response = await request(app)
    .delete(`/api/habits/${nonExistentHabitId}`)
    .set('Authorization', 'Bearer valid-firebase-token');

  expect(response.status).toBe(404);
  expect(response.body.message).toBe('Habit not found');
  });

  // test case 3: error handling - user not logged in
  it('should block the delete operation and return an error if the user is not logged in', async () => {
    const habitId = 1;

    const response = await request(app)
      .delete(`/api/habits/${habitId}`)
      // intentionally trigger the "No" path by NOT setting the Authorization header
      .send();

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('Error Message Return'); // validates "Error Message Return" state
  });
});

//Modify habit test cases
describe('Habit Modification API (PUT /api/habits/:id)', () => {
  // test case 1: correct path
  it('should update the habit and return the updated habit when the user is logged in', async () => {
    const habitId = 2;
    const updatedTitle = 'Read for 1 hour';

    const response = await request(app)
      .put(`/api/habits/${habitId}`)
      .set('Authorization', 'Bearer valid-firebase-token') // triggers the "yes" path
      .send({ title: updatedTitle });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe(updatedTitle);
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
});