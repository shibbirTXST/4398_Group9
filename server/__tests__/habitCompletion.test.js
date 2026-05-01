import { jest } from '@jest/globals';
import request from 'supertest';

jest.unstable_mockModule('../db/db.js', () => ({
  default: {
    log: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    habit: {
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    routine: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (callback) => {
      const tx = {
        habit: { create: jest.fn().mockResolvedValue({}) },
        reminder: { create: jest.fn().mockResolvedValue({}) },
        routineHabit: { create: jest.fn().mockResolvedValue({}) },
      };
      return callback(tx);
    }),
  }
}));

jest.unstable_mockModule('../utils/resolveUser.js', () => ({
  findUserByFirebaseUid: jest.fn().mockResolvedValue({ userId: 1 }),
}));

const db = (await import('../db/db.js')).default;
const { default: app } = await import('../app.js');
const { completeHabit, getHabits } = await import('../controllers/habitController.js');

// Helpers
const mockReq = (params = {}, body = {}, user = { uid: 'user1' }) => ({
  params,
  body,
  user,
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('completeHabit (cron-based)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a log and increments streak by 1', async () => {
    db.habit.findFirst.mockResolvedValue({
      habitId: 1,
      userId: 1,
      currentStreak: 2,
      maxStreak: 3,
    });

    db.log.findFirst.mockResolvedValue(null);
    db.log.create.mockResolvedValue({});

    db.habit.update.mockResolvedValue({
      habitId: 1,
      habitName: 'Exercise',
      currentStreak: 3,
      maxStreak: 3,
      reminders: [],
      routineHabits: [],
      logs: [{ logId: 1 }],
    });

    const req = mockReq({ id: '1' });
    const res = mockRes();

    await completeHabit(req, res);

    expect(db.log.create).toHaveBeenCalled();

    expect(db.habit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          currentStreak: 3,
        }),
      })
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        currentStreak: 3,
      })
    );
  });

  it('updates maxStreak when exceeded', async () => {
    db.habit.findFirst.mockResolvedValue({
      habitId: 1,
      userId: 1,
      currentStreak: 5,
      maxStreak: 5,
    });

    db.log.findFirst.mockResolvedValue(null);
    db.log.create.mockResolvedValue({});

    db.habit.update.mockResolvedValue({
      habitId: 1,
      habitName: 'Exercise',
      currentStreak: 6,
      maxStreak: 6,
      reminders: [],
      routineHabits: [],
      logs: [{ logId: 1 }],
    });

    const req = mockReq({ id: '1' });
    const res = mockRes();

    await completeHabit(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        currentStreak: 6,
        maxStreak: 6,
      })
    );
  });

  it('returns 400 if already completed today', async () => {
    db.habit.findFirst.mockResolvedValue({
      habitId: 1,
      userId: 1,
    });

    db.log.findFirst.mockResolvedValue({ logId: 1 });

    const req = mockReq({ id: '1' });
    const res = mockRes();

    await completeHabit(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(db.log.create).not.toHaveBeenCalled();
  });

  it('returns 404 if habit not found', async () => {
    db.habit.findFirst.mockResolvedValue(null);

    const req = mockReq({ id: '999' });
    const res = mockRes();

    await completeHabit(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on unexpected error', async () => {
    db.habit.findFirst.mockRejectedValue(new Error('DB error'));

    const req = mockReq({ id: '1' });
    const res = mockRes();

    await completeHabit(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('getHabits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns habits with completed: true when log exists today', async () => {
    // Mock the findMany to return habits with logs (completed today)
    db.habit.findMany.mockResolvedValue([
      {
        habitId: 1,
        habitName: 'Exercise',
        currentStreak: 3,
        maxStreak: 5,
        reminders: [],
        routineHabits: [],
        logs: [{ logId: 1 }],
      },
    ]);

    const response = await request(app)
      .get('/api/habits')
      .set('Authorization', 'Bearer valid-firebase-token');

    await getHabits(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        completed: true,
      }),
    ]);
  });

  it('returns habits with completed: false when no logs today', async () => {
    // Mock the findMany to return habits without logs (not completed)
    db.habit.findMany.mockResolvedValue([
      {
        habitId: 1,
        habitName: 'Exercise',
        currentStreak: 0,
        maxStreak: 5,
        reminders: [],
        routineHabits: [],
        logs: [],
      },
    ]);

    const response = await request(app)
      .get('/api/habits')
      .set('Authorization', 'Bearer valid-firebase-token');

    await getHabits(req, res);

    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        completed: false,
      }),
    ]);
  });

  it('returns 500 if database fails', async () => {
    db.habit.findMany.mockRejectedValue(new Error('DB error'));

    const response = await request(app)
      .get('/api/habits')
      .set('Authorization', 'Bearer valid-firebase-token');

    await getHabits(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});