import { jest } from '@jest/globals';

jest.unstable_mockModule('../db/db.js', () => ({
  default: {
    habit: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    log: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
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

describe('completeHabit (earning logic only)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('increments streak and maxStreak', async () => {
    db.habit.findFirst.mockResolvedValue({
      habitId: 1,
      userId: 1,
      currentStreak: 2,
      maxStreak: 3,
      streakShields: 0,
    });

    db.log.findFirst.mockResolvedValue(null);
    db.log.create.mockResolvedValue({});

    db.habit.update.mockResolvedValue({
      habitId: 1,
      currentStreak: 3,
      maxStreak: 3,
      streakShields: 0,
      reminders: [],
      routineHabits: [],
      logs: [{ logId: 1 }],
    });

    const res = mockRes();
    await completeHabit(mockReq({ id: '1' }), res);

    expect(db.habit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          currentStreak: 3,
          maxStreak: 3,
        }),
      })
    );
  });

  it('awards shield at milestone (7)', async () => {
    db.habit.findFirst.mockResolvedValue({
      habitId: 1,
      userId: 1,
      currentStreak: 6,
      maxStreak: 6,
      streakShields: 0,
    });

    db.log.findFirst.mockResolvedValue(null);
    db.log.create.mockResolvedValue({});

    db.habit.update.mockResolvedValue({
      habitId: 1,
      currentStreak: 7,
      maxStreak: 7,
      streakShields: 1,
      reminders: [],
      routineHabits: [],
      logs: [{ logId: 1 }],
    });

    const res = mockRes();
    await completeHabit(mockReq({ id: '1' }), res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        currentStreak: 7,
        streakShields: 1,
      })
    );
  });

  it('does not exceed shield cap (3)', async () => {
    db.habit.findFirst.mockResolvedValue({
      habitId: 1,
      userId: 1,
      currentStreak: 6,
      maxStreak: 6,
      streakShields: 3,
    });

    db.log.findFirst.mockResolvedValue(null);
    db.log.create.mockResolvedValue({});

    db.habit.update.mockResolvedValue({
      habitId: 1,
      currentStreak: 7,
      maxStreak: 7,
      streakShields: 3,
      reminders: [],
      routineHabits: [],
      logs: [{ logId: 1 }],
    });

    const res = mockRes();
    await completeHabit(mockReq({ id: '1' }), res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        streakShields: 3,
      })
    );
  });

  it('returns 400 if already completed today', async () => {
    db.habit.findFirst.mockResolvedValue({ habitId: 1, userId: 1 });
    db.log.findFirst.mockResolvedValue({ logId: 1 });

    const res = mockRes();
    await completeHabit(mockReq({ id: '1' }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(db.log.create).not.toHaveBeenCalled();
  });

  it('returns 500 on unexpected error', async () => {
    db.habit.findFirst.mockRejectedValue(new Error('DB error'));

    const res = mockRes();
    await completeHabit(mockReq({ id: '1' }), res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('runStreakJob (shield consumption + reset)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('consumes shield if habit missed yesterday', async () => {
    db.habit.findMany.mockResolvedValue([
      {
        habitId: 1,
        streakShields: 2,
        currentStreak: 5,
        lastCompletedAt: new Date(Date.now() - 2 * 86400000),
      },
    ]);

    await runStreakJob().task?.fireOnTick?.();

    expect(db.habit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          streakShields: 1,
        }),
      })
    );
  });

  it('resets streak if no shields', async () => {
    db.habit.findMany.mockResolvedValue([
      {
        habitId: 1,
        streakShields: 0,
        currentStreak: 5,
        lastCompletedAt: new Date(Date.now() - 2 * 86400000),
      },
    ]);

    await runStreakJob().task?.fireOnTick?.();

    expect(db.habit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          currentStreak: 0,
        }),
      })
    );
  });

  it('does nothing if completed yesterday', async () => {
    db.habit.findMany.mockResolvedValue([
      {
        habitId: 1,
        streakShields: 2,
        currentStreak: 5,
        lastCompletedAt: new Date(Date.now() - 86400000),
      },
    ]);

    await runStreakJob().task?.fireOnTick?.();

    expect(db.habit.update).not.toHaveBeenCalled();
  });
});