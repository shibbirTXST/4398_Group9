jest.mock('../firebaseAdmin', () => ({
  __esModule: true,
  default: {
    auth: () => ({
      verifyIdToken: jest.fn(),
    }),
  },
}));

jest.mock('../db/db.js', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    user: {},
    habit: {},
  },
}));

const request = require('supertest');
const app = require('../app');

//test cases
//simple test case for root endpoint
describe('API root', () => {
  it('responds with welcome message', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Welcome to the Habit Tracker API' });
  });
});