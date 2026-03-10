const request = require('supertest');
const app = require('../app');
const admin = require('firebase-admin');

//test cases
//simple test case for root endpoint
describe('API root', () => {
  it('responds with welcome message', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Welcome to the Habit Tracker API' });
  });
});

jest.mock('firebase-admin', () => ({
  auth: jest.fn().mockReturnThis(),
  deleteUser: jest.fn(),
}));

describe('DELETE /api/user/:uid', () => {
  const mockUid = 'firebase-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Should delete user from Firebase', async () => {
    admin.auth().deleteUser.mockResolvedValueOnce();

    const response = await request(app)
      .delete(`/api/user/${mockUid}`)

    expect(response.status).toBe(204);

    expect(admin.auth().deleteUser).toHaveBeenCalledWith(mockUid);
  });
});