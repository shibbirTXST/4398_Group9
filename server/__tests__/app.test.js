import { jest } from '@jest/globals';

jest.unstable_mockModule('../firebaseAdmin.js', () => ({
  __esModule: true,
  default: {
    auth: () => ({
      verifyIdToken: jest.fn(),
    }),
  },
}));

jest.unstable_mockModule('../db/db.js', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    user: {},
    habit: {},
  },
}));

const { default: request } = await import('supertest');
const { default: app } = await import('../app.js');

//test cases
//simple test case for root endpoint
describe('API root', () => {
  it('responds with welcome message', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Welcome to the Habit Tracker API' });
  });
});