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
  const existingHabit = {
    habitId: 2,
    userId: 1,
    habitName: 'Old name',
    description: null,
    targetGoal: null,
    goalUnit: null,
    frequencyType: 'Daily',
    status: 'Active',
    createdAt: new Date(),
  };
  return {
    __esModule: true,
    default: {
      user: {
        upsert: jest.fn().mockResolvedValue(userRow),
      },
      habit: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          if (where.habitId === 2 && where.userId === 1) {
            return Promise.resolve({ ...existingHabit });
          }
          return Promise.resolve(null);
        }),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            habitId: 2,
            habitName: data.habitName ?? existingHabit.habitName,
            description: data.description ?? existingHabit.description,
            targetGoal: data.targetGoal ?? existingHabit.targetGoal,
            goalUnit: data.goalUnit ?? existingHabit.goalUnit,
            frequencyType: data.frequencyType ?? existingHabit.frequencyType,
            status: data.status ?? existingHabit.status,
            createdAt: existingHabit.createdAt,
          })
        ),
      },
    },
  };
});

import request from 'supertest';
import app from '../app';

describe('Habit Modification API (PUT /api/habits/:id)', () => {
  it('should update habitName when the user is logged in', async () => {
    const res = await request(app)
      .put('/api/habits/2')
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({ habitName: 'Read for 1 hour' });

    expect(res.status).toBe(200);
    expect(res.body.habitName).toBe('Read for 1 hour');
  });

  it('should accept title as an alias for habitName', async () => {
    const res = await request(app)
      .put('/api/habits/2')
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({ title: 'Via title' });

    expect(res.status).toBe(200);
    expect(res.body.habitName).toBe('Via title');
  });

  it('should return 404 if the habit does not exist', async () => {
    const res = await request(app)
      .put('/api/habits/9999')
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({ habitName: 'X' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Habit not found');
  });

  it('should return 401 if the user is not logged in', async () => {
    const res = await request(app)
      .put('/api/habits/2')
      .send({ habitName: 'Read' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('should return 400 if no updatable fields are provided', async () => {
    const res = await request(app)
      .put('/api/habits/2')
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('No updatable fields');
  });

  it('should return 400 for an invalid habit ID', async () => {
    const res = await request(app)
      .put('/api/habits/not-a-number')
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({ habitName: 'Read' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid habit ID');
  });
});
