import db from '../db/db.js';
import { upsertUserFromDecodedToken } from '../utils/resolveUser.js';

const habitSelect = {
  habitId: true,
  habitName: true,
  description: true,
  targetGoal: true,
  goalUnit: true,
  status: true,
  frequencyType: true,
  createdAt: true,
};

const getHabits = async (req, res) => {
  try {
    const user = await upsertUserFromDecodedToken(req.user);
    const habits = await db.habit.findMany({
      where: { userId: user.userId },
      select: habitSelect,
    });
    res.status(200).json(habits);
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createHabit = async (req, res) => {
  try {
    const user = await upsertUserFromDecodedToken(req.user);
    const {
      habitName,
      title,
      frequencyType,
      status,
      description,
      targetGoal,
      goalUnit,
    } = req.body;

    const name = habitName ?? title;
    if (!name || !frequencyType || !status) {
      return res.status(400).json({
        error: 'habitName (or title), frequencyType, and status are required',
      });
    }

    const habit = await db.habit.create({
      data: {
        userId: user.userId,
        habitName: name,
        frequencyType,
        status,
        description: description ?? null,
        targetGoal: targetGoal ?? null,
        goalUnit: goalUnit ?? null,
      },
      select: habitSelect,
    });

    res.status(201).json({
      message: 'Habit successfully created',
      habit,
    });
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteHabit = async (req, res) => {
  try {
    const habitId = parseInt(req.params.id, 10);
    if (Number.isNaN(habitId)) {
      return res.status(400).json({ error: 'Invalid habit ID' });
    }

    const user = await upsertUserFromDecodedToken(req.user);
    const result = await db.habit.deleteMany({
      where: { habitId, userId: user.userId },
    });

    if (result.count === 0) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    res.status(200).json({ message: 'Habit deleted' });
  } catch (error) {
    console.error('Error deleting habit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateHabit = async (req, res) => {
  try {
    const habitId = parseInt(req.params.id, 10);
    if (Number.isNaN(habitId)) {
      return res.status(400).json({ error: 'Invalid habit ID' });
    }

    const user = await upsertUserFromDecodedToken(req.user);
    const existing = await db.habit.findFirst({
      where: { habitId, userId: user.userId },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    const {
      habitName,
      title,
      description,
      frequencyType,
      status,
      targetGoal,
      goalUnit,
    } = req.body;

    const data = {};
    if (habitName != null || title != null) {
      data.habitName = habitName ?? title;
    }
    if (description !== undefined) data.description = description;
    if (frequencyType !== undefined) data.frequencyType = frequencyType;
    if (status !== undefined) data.status = status;
    if (targetGoal !== undefined) data.targetGoal = targetGoal;
    if (goalUnit !== undefined) data.goalUnit = goalUnit;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided' });
    }

    const habit = await db.habit.update({
      where: { habitId },
      data,
      select: habitSelect,
    });

    res.status(200).json(habit);
  } catch (error) {
    console.error('Error updating habit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export { getHabits, createHabit, deleteHabit, updateHabit };
