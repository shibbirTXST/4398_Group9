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
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            habitId: 42,
            habitName: data.habitName,
            description: data.description,
            targetGoal: data.targetGoal,
            goalUnit: data.goalUnit,
            frequencyType: data.frequencyType,
            status: data.status,
            createdAt: new Date(),
          })
        ),
      },
    },
  };
});

import request from 'supertest';
import app from '../app';

describe('Habit Addition API (POST /api/habits)', () => {
  it('should create a habit when the user is logged in', async () => {
    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({
        habitName: 'Drink Water',
        frequencyType: 'Daily',
        status: 'Active',
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Habit successfully created');
    expect(res.body.habit).toHaveProperty('habitId');
    expect(res.body.habit.habitName).toBe('Drink Water');
  });

  it('should accept title as an alias for habitName', async () => {
    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({
        title: 'Read',
        frequencyType: 'Daily',
        status: 'Active',
      });

    expect(res.status).toBe(201);
    expect(res.body.habit.habitName).toBe('Read');
  });

  it('should return 401 if the user is not logged in', async () => {
    const res = await request(app).post('/api/habits').send({
      habitName: 'Read a Book',
      frequencyType: 'Daily',
      status: 'Active',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('should return 400 if habitName, frequencyType, or status is missing', async () => {
    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({ frequencyType: 'Daily', status: 'Active' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('required');
  });
});
