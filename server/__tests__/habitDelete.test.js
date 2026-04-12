import request from 'supertest';
import app from '../app.js';

jest.mock('../firebaseAdmin.js', () => ({
  __esModule: true,
  default: {
    auth: () => ({
      verifyIdToken: jest.fn().mockResolvedValue({
        uid: 'test-uid',
        email: 'user@test.com',
      }),
    }),
  },
}));

describe('Habit Deletion API (DELETE /api/habits/:id)', () => {

  // test case 1: correct path
  it('should delete the habit and return success when the user is logged in', async () => {
    const response = await request(app)
      .delete('/api/habits/1')
      .set('Authorization', 'Bearer valid-firebase-token') // triggers the "yes" path
      .send();

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Habit deleted');
  });

  // test case 2: error handling - habit not found
  it('should return 404 Not Found if the habit does not exist', async () => {
    const response = await request(app)
      .delete('/api/habits/9999')
      .set('Authorization', 'Bearer valid-firebase-token');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Habit not found');
  });

  // test case 3: error handling - user not logged in
  it('should block the delete operation and return an error if the user is not logged in', async () => {
    const response = await request(app)
      .delete('/api/habits/1')
      // intentionally trigger the "No" path by NOT setting the Authorization header
      .send();

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined(); // validates "Error Message Return" state
  });

  // test case 4: error handling - invalid habit ID
  it('should return an error if the habit ID is invalid', async () => {
    const response = await request(app)
      .delete('/api/habits/invalid-id')
      .set('Authorization', 'Bearer valid-firebase-token')
      .send();

    expect(response.status).toBe(400); 
    expect(response.body.error).toBeDefined(); 
  });
});