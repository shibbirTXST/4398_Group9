jest.mock('../firebaseAdmin', () => ({
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

jest.mock('../db/db.js', () => {
  const userRow = {
    userId: 1,
    firebaseUid: 'test-uid',
    email: 'user@test.com',
    username: 'user',
    createdAt: new Date(),
    profilePicUrl: null,
    activeStatus: null,
  };
  return {
    __esModule: true,
    default: {
      user: {
        upsert: jest.fn().mockResolvedValue(userRow),
      },
      habit: {
        deleteMany: jest.fn().mockImplementation(({ where }) => {
          if (where.habitId === 1) return Promise.resolve({ count: 1 });
          return Promise.resolve({ count: 0 });
        }),
      },
    },
  };
});

const request = require('supertest');
const app = require('../app');

describe('Habit Deletion API (DELETE /api/habits/:id)', () => {
  it('should delete the habit when the user is logged in', async () => {
    const res = await request(app)
      .delete('/api/habits/1')
      .set('Authorization', 'Bearer valid-firebase-token');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Habit deleted');
  });

  it('should return 404 if the habit does not exist', async () => {
    const res = await request(app)
      .delete('/api/habits/9999')
      .set('Authorization', 'Bearer valid-firebase-token');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Habit not found');
  });

  it('should return 401 if the user is not logged in', async () => {
    const res = await request(app).delete('/api/habits/1');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('should return 400 for an invalid habit ID', async () => {
    const res = await request(app)
      .delete('/api/habits/invalid-id')
      .set('Authorization', 'Bearer valid-firebase-token');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid habit ID');
  });
});
