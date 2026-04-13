const db = require('../db/db.js');
const { completeHabit, getHabits } = require('../controllers/habitController.js');

jest.mock('../db/db.js', () => ({
  log: {
    findFirst: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  habit: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
}));

jest.mock('../utils/resolveUser.js', () => ({
  upsertUserFromDecodedToken: jest.fn().mockResolvedValue({ userId: 1 }),
}));

const mockReq = (params = {}, body = {}, user = {}) => ({ params, body, user });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('completeHabit', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a log entry and updates streak on completion', async () => {
    const habit = { habitId: 1, currentStreak: 2, maxStreak: 3 };
    const updatedHabit = { ...habit, currentStreak: 3, maxStreak: 3 };

    db.log.findFirst.mockResolvedValue(null);
    db.habit.findUnique.mockResolvedValue(habit);
    db.$transaction.mockResolvedValue([{}, updatedHabit]);

    const req = mockReq({ id: '1' });
    const res = mockRes();
    await completeHabit(req, res);

    expect(db.$transaction).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ ...updatedHabit, completed: true });
  });

  it('updates maxStreak when currentStreak exceeds it', async () => {
    const habit = { habitId: 1, currentStreak: 5, maxStreak: 5 };
    const updatedHabit = { ...habit, currentStreak: 6, maxStreak: 6 };

    db.log.findFirst.mockResolvedValue(null);
    db.habit.findUnique.mockResolvedValue(habit);
    db.$transaction.mockResolvedValue([{}, updatedHabit]);

    const req = mockReq({ id: '1' });
    const res = mockRes();
    await completeHabit(req, res);

    expect(res.json).toHaveBeenCalledWith({ ...updatedHabit, completed: true });
  });

  it('returns 400 if habit already completed today', async () => {
    db.log.findFirst.mockResolvedValue({ logId: 1 });

    const req = mockReq({ id: '1' });
    const res = mockRes();
    await completeHabit(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Habit already completed today' });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('returns 404 if habit does not exist', async () => {
    db.log.findFirst.mockResolvedValue(null);
    db.habit.findUnique.mockResolvedValue(null);

    const req = mockReq({ id: '999' });
    const res = mockRes();
    await completeHabit(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Habit not found' });
  });

  it('returns 500 if the database throws an error', async () => {
    db.log.findFirst.mockRejectedValue(new Error('DB error'));

    const req = mockReq({ id: '1' });
    const res = mockRes();
    await completeHabit(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});

describe('getHabits', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns habits with completed: true for habits with a log today', async () => {
    db.habit.findMany.mockResolvedValue([
      { habitId: 1, habitName: 'Exercise', currentStreak: 3, maxStreak: 5, logs: [{ logId: 1 }] },
    ]);

    const req = mockReq({}, {}, { uid: 'user1' });
    const res = mockRes();
    await getHabits(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({ habitId: 1, completed: true, logs: undefined }),
    ]);
  });

  it('returns habits with completed: false when no log exists today', async () => {
    db.habit.findMany.mockResolvedValue([
      { habitId: 1, habitName: 'Exercise', currentStreak: 0, maxStreak: 5, logs: [] },
    ]);

    const req = mockReq({}, {}, { uid: 'user1' });
    const res = mockRes();
    await getHabits(req, res);

    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({ habitId: 1, completed: false }),
    ]);
  });

  it('returns 500 if the database throws an error', async () => {
    db.habit.findMany.mockRejectedValue(new Error('DB error'));

    const req = mockReq({}, {}, { uid: 'user1' });
    const res = mockRes();
    await getHabits(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});