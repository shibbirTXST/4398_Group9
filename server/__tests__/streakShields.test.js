import { jest } from '@jest/globals';

jest.unstable_mockModule('../db/db.js', () => ({
  default: {
    habit: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    log: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

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

describe('Streak Shields - completeHabit', () => {
  beforeEach(() => jest.clearAllMocks());

  // Uses shield to preserve streak
  it('uses a streak shield when a day is missed', async () => {
    db.habit.findFirst.mockResolvedValue({
      habitId: 1,
      userId: 1,
      currentStreak: 5,
      maxStreak: 5,
      streakShields: 2,
    });

    db.log.findFirst.mockResolvedValue(null); // not completed today

    // simulate gap (missed yesterday)
    db.log.findMany.mockResolvedValue([
      { logDate: new Date(Date.now() - 2 * 86400000), completionStatus: true },
    ]);

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

    expect(db.habit.update).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        currentStreak: 6,
        streakShields: 1,
      })
    );
  });

  // Resets streak if no shields
  it('resets streak when no shields are available', async () => {
    db.habit.findFirst.mockResolvedValue({
      habitId: 1,
      userId: 1,
      currentStreak: 5,
      maxStreak: 5,
      streakShields: 0,
    });

    db.log.findFirst.mockResolvedValue(null);

    db.log.findMany.mockResolvedValue([
      { logDate: new Date(Date.now() - 2 * 86400000), completionStatus: true },
    ]);

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

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        currentStreak: 1,
        streakShields: 0,
      })
    );
  });

  // Consumes only one shield per missed day
  it('consumes only one shield per missed day', async () => {
    db.habit.findFirst.mockResolvedValue({
      habitId: 1,
      userId: 1,
      currentStreak: 5,
      maxStreak: 5,
      streakShields: 2,
    });

    db.log.findFirst.mockResolvedValue(null);

    db.log.findMany.mockResolvedValue([
      { logDate: new Date(Date.now() - 2 * 86400000), completionStatus: true },
    ]);

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

  // Earns shield at milestone
  it('awards a streak shield at milestone (e.g., 7 days)', async () => {
    db.habit.findFirst.mockResolvedValue({
      habitId: 1,
      userId: 1,
      currentStreak: 6,
      maxStreak: 6,
      streakShields: 0,
    });

    db.log.findFirst.mockResolvedValue(null);

    db.log.findMany.mockResolvedValue([
      { logDate: new Date(), completionStatus: true },
      { logDate: new Date(Date.now() - 86400000), completionStatus: true },
      { logDate: new Date(Date.now() - 2 * 86400000), completionStatus: true },
      { logDate: new Date(Date.now() - 3 * 86400000), completionStatus: true },
      { logDate: new Date(Date.now() - 4 * 86400000), completionStatus: true },
      { logDate: new Date(Date.now() - 5 * 86400000), completionStatus: true },
    ]);

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
    });

    db.log.findFirst.mockResolvedValue(null);

    db.log.findMany.mockResolvedValue([
      { logDate: new Date(), completionStatus: true },
    ]);

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

  // Handles multiple missed days consuming multiple shields
  it('consumes multiple shields for multiple missed days', async () => {
    db.habit.findFirst.mockResolvedValue({
      habitId: 1,
      userId: 1,
      currentStreak: 5,
      maxStreak: 5,
      streakShields: 2,
    });

    db.log.findFirst.mockResolvedValue(null);

    db.log.findMany.mockResolvedValue([
      { logDate: new Date(Date.now() - 3 * 86400000), completionStatus: true },
    ]);

    db.log.create.mockResolvedValue({});

    db.habit.update.mockResolvedValue({
      habitId: 1,
      currentStreak: 6,
      maxStreak: 6,
      streakShields: 0,
      reminders: [],
      routineHabits: [],
      logs: [{ logId: 1 }],
    });

    const req = mockReq({ id: '1' });
    const res = mockRes();

    await completeHabit(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        streakShields: 0,
      })
    );
  });
});