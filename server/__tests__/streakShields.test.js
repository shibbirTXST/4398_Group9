import { jest } from '@jest/globals';

// Mock DB
jest.unstable_mockModule('../db/db.js', () => ({
  default: {
    habit: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    log: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock user resolver
jest.unstable_mockModule('../utils/resolveUser.js', () => ({
  findUserByFirebaseUid: jest.fn().mockResolvedValue({ userId: 1 }),
}));

const db = (await import('../db/db.js')).default;
const { completeHabit } = await import('../controllers/habitController.js');

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

describe('Streak Shields (cron-based)', () => {
  beforeEach(() => jest.clearAllMocks());

  // Uses shield when user missed a day
  it('uses a streak shield when a missed day is detected', async () => {
    db.habit.findFirst.mockResolvedValue({
      habitId: 1,
      userId: 1,
      currentStreak: 5,
      maxStreak: 5,
      streakShields: 2,
      lastCompletedAt: new Date(Date.now() - 2 * 86400000), // missed yesterday
    });

    db.log.findFirst.mockResolvedValue(null);
    db.log.create.mockResolvedValue({});

    db.habit.update.mockResolvedValue({
      habitId: 1,
      currentStreak: 6,
      maxStreak: 6,
      streakShields: 1,
      reminders: [],
      routineHabits: [],
      logs: [{ logId: 1 }],
    });

    const req = mockReq({ id: '1' });
    const res = mockRes();

    await completeHabit(req, res);

    expect(db.habit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          currentStreak: 6,
          streakShields: 1,
        }),
      })
    );
  });

  // Resets streak when no shields available
  it('resets streak when no shields are available', async () => {
    db.habit.findFirst.mockResolvedValue({
      habitId: 1,
      userId: 1,
      currentStreak: 5,
      maxStreak: 5,
      streakShields: 0,
      lastCompletedAt: new Date(Date.now() - 2 * 86400000),
    });

    db.log.findFirst.mockResolvedValue(null);
    db.log.create.mockResolvedValue({});

    db.habit.update.mockResolvedValue({
      habitId: 1,
      currentStreak: 1,
      maxStreak: 5,
      streakShields: 0,
      reminders: [],
      routineHabits: [],
      logs: [{ logId: 1 }],
    });

    const req = mockReq({ id: '1' });
    const res = mockRes();

    await completeHabit(req, res);

    expect(db.habit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          currentStreak: 1,
          streakShields: 0,
        }),
      })
    );
  });

  // Consumes exactly one shield for a single missed day
  it('consumes only one shield for one missed day', async () => {
    db.habit.findFirst.mockResolvedValue({
      habitId: 1,
      userId: 1,
      currentStreak: 5,
      maxStreak: 5,
      streakShields: 2,
      lastCompletedAt: new Date(Date.now() - 2 * 86400000),
    });

    db.log.findFirst.mockResolvedValue(null);
    db.log.create.mockResolvedValue({});

    db.habit.update.mockResolvedValue({
      habitId: 1,
      currentStreak: 6,
      maxStreak: 6,
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
        streakShields: 1,
      })
    );
  });

  // Awards shield at milestone (e.g., 7-day streak)
  it('awards a streak shield at milestone', async () => {
    db.habit.findFirst.mockResolvedValue({
      habitId: 1,
      userId: 1,
      currentStreak: 6,
      maxStreak: 6,
      streakShields: 0,
      lastCompletedAt: new Date(Date.now() - 86400000),
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

  // Does not exceed shield cap
  it('does not exceed maximum shield cap', async () => {
    db.habit.findFirst.mockResolvedValue({
      habitId: 1,
      userId: 1,
      currentStreak: 6,
      maxStreak: 6,
      streakShields: 3, // assume cap = 3
      lastCompletedAt: new Date(Date.now() - 86400000),
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

    const req = mockReq({ id: '1' });
    const res = mockRes();

    await completeHabit(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        streakShields: 3,
      })
    );
  });

  // Prevents double completion in same day
  it('returns 400 if habit already completed today', async () => {
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

  // Handles unexpected errors
  it('returns 500 on unexpected error', async () => {
    db.habit.findFirst.mockRejectedValue(new Error('DB error'));

    const req = mockReq({ id: '1' });
    const res = mockRes();

    await completeHabit(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});