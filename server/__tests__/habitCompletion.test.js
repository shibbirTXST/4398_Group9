import { jest } from '@jest/globals';

// Mock modules FIRST
jest.unstable_mockModule('../db/db.js', () => ({
  default: {
    log: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    habit: {
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.unstable_mockModule('../utils/resolveUser.js', () => ({
  findUserByFirebaseUid: jest.fn().mockResolvedValue({ userId: 1 }),
}));

// THEN import after mocks
const db = (await import('../db/db.js')).default;
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

describe('completeHabit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress expected console.error logs to keep terminal clean
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a log and updates streak correctly', async () => {
    db.habit.findFirst.mockResolvedValue({
      habitId: 1,
      userId: 1,
      currentStreak: 2,
      maxStreak: 3,
    });

    db.log.findFirst.mockResolvedValue(null);

    db.log.create.mockResolvedValue({});

    db.log.findMany.mockResolvedValue([
      { logDate: new Date(), completionStatus: true },
      { logDate: new Date(Date.now() - 86400000), completionStatus: true },
    ]);

    db.habit.update.mockResolvedValue({
      habitId: 1,
      habitName: 'Exercise',
      currentStreak: 2,
      maxStreak: 3,
      reminders: [],
      routineHabits: [],
      logs: [{ logId: 1 }],
    });

    const req = mockReq({ id: '1' });
    const res = mockRes();

    await completeHabit(req, res);

    expect(db.log.create).toHaveBeenCalled();
    expect(db.habit.update).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ID: '1',
        completed: true,
        currentStreak: 2,
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

    db.log.findMany.mockResolvedValue([
      { logDate: new Date(), completionStatus: true },
      { logDate: new Date(Date.now() - 86400000), completionStatus: true },
      { logDate: new Date(Date.now() - 2 * 86400000), completionStatus: true },
      { logDate: new Date(Date.now() - 3 * 86400000), completionStatus: true },
      { logDate: new Date(Date.now() - 4 * 86400000), completionStatus: true },
      { logDate: new Date(Date.now() - 5 * 86400000), completionStatus: true },
    ]);

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
    expect(res.json).toHaveBeenCalledWith({
      error: 'Already completed today',
    });

    expect(db.log.create).not.toHaveBeenCalled();
  });

  it('returns 404 if habit not found', async () => {
    db.habit.findFirst.mockResolvedValue(null);

    const req = mockReq({ id: '999' });
    const res = mockRes();

    await completeHabit(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Habit not found',
    });
  });

  it('returns 500 on unexpected error', async () => {
    db.habit.findFirst.mockRejectedValue(new Error('DB error'));

    const req = mockReq({ id: '1' });
    const res = mockRes();

    await completeHabit(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Failed to complete habit',
    });
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

    const req = mockReq({}, {}, { uid: 'user1' });
    const res = mockRes();

    await getHabits(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        ID: '1',
        completed: true,
      }),
    ]);
  });

  it('returns habits with completed: false when no logs today', async () => {
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

    const req = mockReq({}, {}, { uid: 'user1' });
    const res = mockRes();

    await getHabits(req, res);

    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        ID: '1',
        completed: false,
      }),
    ]);
  });

  it('returns 500 if database fails', async () => {
    db.habit.findMany.mockRejectedValue(new Error('DB error'));

    const req = mockReq({}, {}, { uid: 'user1' });
    const res = mockRes();

    await getHabits(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.any(String),
    });
  });
});