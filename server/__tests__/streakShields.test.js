import { jest } from '@jest/globals';

jest.unstable_mockModule('../db/db.js', () => ({
  default: {
    habit: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    log: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    habitBadge: {
      findUnique: jest.fn(),
      create: jest.fn(),
    }
  },
}));

jest.unstable_mockModule('../utils/resolveUser.js', () => ({
  findUserByFirebaseUid: jest.fn().mockResolvedValue({ userId: 1 }),
}));

const db = (await import('../db/db.js')).default;
const { completeHabit } = await import('../controllers/habitController.js');
const { runStreakJob } = await import('../jobs/habitStreaks.js');

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

describe('Streak Shields - completeHabit (cron-based architecture)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('awards a shield at 7-day milestone', async () => {
    db.habit.findFirst.mockResolvedValue({
      habitId: 1,
      userId: 1,
      currentStreak: 6,
      maxStreak: 6,
      streakShields: 0,
      badges: [],
    });

    db.log.findFirst.mockResolvedValue(null);
    db.log.create.mockResolvedValue({});

    db.habit.update.mockResolvedValue({
      habitId: 1,
      habitName: 'Test',
      currentStreak: 7,
      maxStreak: 7,
      streakShields: 1,
      reminders: [],
      routineHabits: [],
      logs: [{ logId: 1 }],
    });

    const req = mockReq({ id: '1' });
    const res = mockRes();

    await completeHabit(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        currentStreak: 7,
        streakShields: 1,
      })
    );
  });

  it('does not exceed shield cap', async () => {
    db.habit.findFirst.mockResolvedValue({
      habitId: 1,
      userId: 1,
      currentStreak: 6,
      maxStreak: 6,
      streakShields: 3,
      badges: [],
    });

    db.log.findFirst.mockResolvedValue(null);
    db.log.create.mockResolvedValue({});

    db.habit.update.mockResolvedValue({
      habitId: 1,
      habitName: 'Test',
      currentStreak: 7,
      maxStreak: 7,
      streakShields: 3,
      reminders: [],
      routineHabits: [],
      logs: [{ logId: 1 }],
    });

    const req = mockReq({ id: '1' });
    const res = mockRes();

    await completeHabit(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        streakShields: 3,
      })
    );
  });

  it('awards a badge at milestone', async () => {
    db.habit.findFirst.mockResolvedValue({
      habitId: 1,
      userId: 1,
      currentStreak: 6,
      maxStreak: 6,
      streakShields: 0,
      badges: [],
    });

    db.log.findFirst.mockResolvedValue(null);
    db.log.create.mockResolvedValue({});

    db.habit.update.mockResolvedValue({
      habitId: 1,
      habitName: 'Test',
      currentStreak: 7,
      maxStreak: 7,
      streakShields: 1,
      badges: [7],
      reminders: [],
      routineHabits: [],
      logs: [{ logId: 1 }],
    });

    const req = mockReq({ id: '1' });
    const res = mockRes();

    await completeHabit(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        badges: expect.arrayContaining([7]),
      })
    );
  });

  it('does not duplicate badges', async () => {
    db.habit.findFirst.mockResolvedValue({
      habitId: 1,
      userId: 1,
      currentStreak: 6,
      maxStreak: 6,
      streakShields: 0,
      badges: [7],
    });

    db.log.findFirst.mockResolvedValue(null);
    db.log.create.mockResolvedValue({});

    db.habit.update.mockResolvedValue({
      habitId: 1,
      habitName: 'Test',
      currentStreak: 7,
      maxStreak: 7,
      streakShields: 1,
      badges: [7],
      reminders: [],
      routineHabits: [],
      logs: [{ logId: 1 }],
    });

    const req = mockReq({ id: '1' });
    const res = mockRes();

    await completeHabit(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        badges: [7],
      })
    );
  });

  it('returns 400 if already completed today', async () => {
    db.habit.findFirst.mockResolvedValue({ habitId: 1, userId: 1 });
    db.log.findFirst.mockResolvedValue({ logId: 1 });

    const req = mockReq({ id: '1' });
    const res = mockRes();

    await completeHabit(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    db.habit.findFirst.mockRejectedValue(new Error('DB error'));

    const req = mockReq({ id: '1' });
    const res = mockRes();

    await completeHabit(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('Streak Shields - cron job', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('consumes a shield when a day is missed', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);

    db.habit.findMany.mockResolvedValue([
      {
        habitId: 1,
        currentStreak: 5,
        streakShields: 2,
        lastCompletedAt: yesterday,
      },
    ]);

    db.habit.update.mockResolvedValue({});

    runStreakJob();

    await jest.runOnlyPendingTimersAsync();

    expect(db.habit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          streakShields: 1,
        }),
      })
    );
  });

  it('resets streak when no shields available', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);

    db.habit.findMany.mockResolvedValue([
      {
        habitId: 1,
        currentStreak: 5,
        streakShields: 0,
        lastCompletedAt: yesterday,
      },
    ]);

    db.habit.update.mockResolvedValue({});

    runStreakJob();

    await jest.runOnlyPendingTimersAsync();

    expect(db.habit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          currentStreak: 0,
        }),
      })
    );
  });

  it('does nothing if habit was completed yesterday', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    db.habit.findMany.mockResolvedValue([
      {
        habitId: 1,
        currentStreak: 5,
        streakShields: 2,
        lastCompletedAt: yesterday,
      },
    ]);

    runStreakJob();

    await jest.runOnlyPendingTimersAsync();

    expect(db.habit.update).not.toHaveBeenCalled();
  });
});