import db from '../db/db.js';
import { findUserByFirebaseUid } from '../utils/resolveUser.js';
import { generateRoutineFromAI } from '../utils/aiGenerator.js';

const USER_NOT_FOUND_MESSAGE =
  'User account not found. Sign in again or POST /api/auth/sync to create your profile.';

async function requireDbUser(req, res) {
  const user = await findUserByFirebaseUid(req.user.uid);
  if (!user) {
    res.status(404).json({ error: USER_NOT_FOUND_MESSAGE });
    return null;
  }
  return user;
}

function getTodayRange() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);

  return { start, end };
}

/** Map Prisma habit (+ relations) to the JSON shape the mobile client expects. */
function habitToDto(habit) {
  const reminder = habit.reminders?.[0];
  const link = habit.routineHabits?.[0];

  const completedToday = habit.logs?.length > 0;

  return {
    ID: String(habit.habitId),
    title: habit.habitName,
    completed: completedToday,
    count: completedToday ? 1 : 0,
    reminderTime: reminder?.reminderTime ?? '09:00',
    routineID: link ? link.routineId : 0,
    maxStreak: habit.maxStreak,
    currentStreak: habit.currentStreak,
    enabledStatus: reminder?.enabledStatus ?? true,
  };
}

const habitInclude = {
  reminders: true,
  routineHabits: { include: { routine: true } },
  logs: true,
};

/** Normalize to HH:mm so the reminder cron (server/jobs/reminder.js) can match the current minute. */
function normalizeReminderTimeForCron(raw) {
  const s = String(raw ?? '').trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return s || '09:00';
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function routineToDto(routine) {
  return {
    ID: String(routine.routineId),
    title: routine.routineName,
  };
}

const getHabits = async (req, res) => {
  try {
    const user = await requireDbUser(req, res);
    if (!user) return;

    const { start, end } = getTodayRange();

    const rows = await db.habit.findMany({
      where: { userId: user.userId, status: 'Active' },
      include: {
        reminders: true,
        routineHabits: { include: { routine: true } },
        logs: {
          where: {
            logDate: {
              gte: start,
              lte: end,
            },
            completionStatus: true,
          },
        },
      },
      orderBy: { habitId: 'asc' },
    });
    return res.status(200).json(rows.map(habitToDto));
  } catch (err) {
    console.error('Error fetching habits:', err);
    return res.status(500).json({ error: 'Failed to fetch habits' });
  }
};

const getRoutines = async (req, res) => {
  const user = await requireDbUser(req, res);
  if (!user) return;

  const rows = await db.routine.findMany({
    where: { userId: user.userId, status: 'Active' },
    orderBy: { routineId: 'asc' },
  });
  res.status(200).json(rows.map(routineToDto));
};

// --- HABIT CONTROLLERS ---
const createHabit = async (req, res) => {
  const user = await requireDbUser(req, res);
  if (!user) return;

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Error Message Return: Request body is required' });
  }

  const { title, reminderTime, routineID } = req.body;

  if (!title || !reminderTime || (!routineID && routineID !== 0 && routineID !== '0')) {
    return res.status(400).json({ error: 'Error Message Return: Title, reminder time, and routine ID are required' });
  }

  const rId = typeof routineID === 'string' ? parseInt(routineID, 10) : parseInt(String(routineID), 10);
  if (Number.isNaN(rId)) {
    return res.status(400).json({ error: 'Error Message Return: Invalid routine ID' });
  }

  if (rId !== 0) {
    const routine = await db.routine.findFirst({
      where: { routineId: rId, userId: user.userId },
    });
    if (!routine) {
      return res.status(400).json({ error: 'Error Message Return: Routine not found or not owned by user' });
    }
  }

  try {
    const habitId = await db.$transaction(async (tx) => {
      const habit = await tx.habit.create({
        data: {
          userId: user.userId,
          habitName: String(title).trim(),
          frequencyType: 'Daily',
          status: 'Active',
        },
      });
      await tx.reminder.create({
        data: {
          habitId: habit.habitId,
          reminderTime: normalizeReminderTimeForCron(reminderTime),
          enabledStatus: true,
        },
      });
      if (rId !== 0) {
        await tx.routineHabit.create({
          data: {
            habitId: habit.habitId,
            routineId: rId,
            orderIndex: 0,
          },
        });
      }
      return habit.habitId;
    });

    const created = await db.habit.findFirst({
      where: { habitId: habitId, userId: user.userId },
      include: habitInclude,
    });
    res.status(201).json({ message: 'Habit successfully created', habit: habitToDto(created) });
  } catch (err) {
    console.error('createHabit', err);
    res.status(500).json({ error: 'Failed to create habit' });
  }
};

const deleteHabit = async (req, res) => {
  const user = await requireDbUser(req, res);
  if (!user) return;

  const id = req.params.ID || req.params.id;
  if (isNaN(parseInt(id, 10))) {
    return res.status(400).json({ error: 'Error Message Return: Invalid habit ID' });
  }

  const habitId = parseInt(id, 10);
  const result = await db.habit.deleteMany({
    where: { habitId, userId: user.userId },
  });

  if (result.count === 0) {
    return res.status(404).json({ message: 'Habit not found' });
  }

  res.status(200).json({ message: 'Habit deleted' });
};

const updateHabit = async (req, res) => {
  const user = await requireDbUser(req, res);
  if (!user) return;

  const id = req.params.ID || req.params.id;
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Error Message Return: Request body is required' });
  }

  const { title, reminderTime, routineID, enabledStatus } = req.body;

  const isEnabled = enabledStatus ?? true;

  if (isNaN(parseInt(id, 10))) {
    return res.status(400).json({ error: 'Error Message Return: Invalid habit ID' });
  }

  if (!title || !reminderTime || (!routineID && routineID !== 0 && routineID !== '0')) {
    return res.status(400).json({ error: 'Error Message Return: Title, reminder time, and RoutineID are required' });
  }

  const rId = typeof routineID === 'string' ? parseInt(routineID, 10) : parseInt(String(routineID), 10);
  if (Number.isNaN(rId)) {
    return res.status(400).json({ error: 'Error Message Return: Invalid routine ID' });
  }

  const habitId = parseInt(id, 10);
  const existing = await db.habit.findFirst({
    where: { habitId, userId: user.userId },
  });
  if (!existing) {
    return res.status(404).json({ message: 'Habit not found' });
  }

  if (rId !== 0) {
    const routine = await db.routine.findFirst({
      where: { routineId: rId, userId: user.userId },
    });
    if (!routine) {
      return res.status(400).json({ error: 'Error Message Return: Routine not found or not owned by user' });
    }
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.habit.update({
        where: { habitId },
        data: { habitName: String(title).trim() },
      });
      await tx.reminder.deleteMany({ where: { habitId } });
      await tx.reminder.create({
        data: {
          habitId,
          reminderTime: normalizeReminderTimeForCron(reminderTime),
          enabledStatus: isEnabled,
        },
      });
      await tx.routineHabit.deleteMany({ where: { habitId } });
      if (rId !== 0) {
        await tx.routineHabit.create({
          data: { habitId, routineId: rId, orderIndex: 0 },
        });
      }
    });

    const updated = await db.habit.findFirst({
      where: { habitId, userId: user.userId },
      include: habitInclude,
    });
    res.status(200).json({ habit: habitToDto(updated) });
  } catch (err) {
    console.error('updateHabit', err);
    res.status(500).json({ error: 'Failed to update habit' });
  }
};

const completeHabit = async (req, res) => {
  try {
    const user = await requireDbUser(req, res);
    if (!user) return;

    const habitId = Number(req.params.id);
    if (!habitId) {
      return res.status(400).json({ error: 'Invalid habit ID' });
    }

    // Verify habit belongs to user
    const habit = await db.habit.findFirst({
      where: {
        habitId,
        userId: user.userId,
      },
    });

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const { start: startOfDay, end: endOfDay } = getTodayRange();

    // ===== Prevent duplicate completion =====
    const existingLog = await db.log.findFirst({
      where: {
        habitId,
        logDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existingLog) {
      return res.status(400).json({ error: 'Already completed today' });
    }

    // ===== Create today's log =====
    await db.log.create({
      data: {
        habitId,
        logDate: new Date(),
        completionStatus: true,
      },
    });

    // ===== Increment streak =====
    const updatedHabit = await db.habit.update({
      where: { habitId },
      data: {
        currentStreak: habit.currentStreak + 1,
        maxStreak: Math.max(habit.currentStreak + 1, habit.maxStreak),
      },
      include: {
        reminders: true,
        routineHabits: { include: { routine: true } },
        logs: {
          where: {
            logDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
            completionStatus: true,
          },
        },
      },
    });

    return res.status(200).json(habitToDto(updatedHabit));

  } catch (err) {
    console.error('Error completing habit:', err);
    return res.status(500).json({ error: 'Failed to complete habit' });
  }
};

// --- ROUTINE CONTROLLERS ---

const createRoutine = async (req, res) => {
  const user = await requireDbUser(req, res);
  if (!user) return;

  const title = req.body?.title != null ? String(req.body.title).trim() : '';
  const routineName = title || 'New Routine';

  try {
    const created = await db.routine.create({
      data: {
        userId: user.userId,
        routineName,
        status: 'Active',
      },
    });
    res.status(201).json({
      message: 'Routine successfully created',
      routine: routineToDto(created),
    });
  } catch (err) {
    console.error('createRoutine', err);
    res.status(500).json({ error: 'Failed to create routine' });
  }
};

const deleteRoutine = async (req, res) => {
  const user = await requireDbUser(req, res);
  if (!user) return;

  const id = req.params.ID || req.params.id;
  if (isNaN(parseInt(id, 10))) {
    return res.status(400).json({ error: 'Error Message Return: Invalid routine ID' });
  }

  const routineId = parseInt(id, 10);
  const existing = await db.routine.findFirst({
    where: { routineId, userId: user.userId },
  });
  if (!existing) {
    return res.status(404).json({ message: 'Routine not found' });
  }

  try {
    await db.$transaction(async (tx) => {
      const links = await tx.routineHabit.findMany({
        where: {
          routineId,
          habit: { userId: user.userId },
        },
        select: { habitId: true },
      });
      const habitIds = [...new Set(links.map((l) => l.habitId))];
      if (habitIds.length > 0) {
        await tx.habit.deleteMany({
          where: { habitId: { in: habitIds }, userId: user.userId },
        });
      }
      await tx.routine.delete({ where: { routineId } });
    });
    res.status(200).json({ message: 'Routine deleted' });
  } catch (err) {
    console.error('deleteRoutine', err);
    res.status(500).json({ error: 'Failed to delete routine' });
  }
};


const updateRoutine = async (req, res) => {
  const user = await requireDbUser(req, res);
  if (!user) return;

  const id = req.params.ID || req.params.id;
  if (isNaN(parseInt(id, 10))) {
    return res.status(400).json({ error: 'Error Message Return: Invalid routine ID' });
  }

  const routineId = parseInt(id, 10);
  const title = req.body?.title != null ? String(req.body.title).trim() : '';
  if (!title) {
    return res.status(400).json({ error: 'Error Message Return: Title is required' });
  }

  const existing = await db.routine.findFirst({
    where: { routineId, userId: user.userId },
  });
  if (!existing) {
    return res.status(404).json({ message: 'Routine not found' });
  }

  try {
    const updated = await db.routine.update({
      where: { routineId },
      data: { routineName: title },
    });
    res.status(200).json({
      message: 'Routine successfully updated',
      routine: { ...routineToDto(updated), routineId: updated.routineId },
    });
  } catch (err) {
    console.error('updateRoutine', err);
    res.status(500).json({ error: 'Failed to update routine' });
  }
};

const generateAIRoutine = async (req, res) => {
  // Authentication Check 
  const user = await requireDbUser(req, res);
  if (!user) return;

  const { 
    routineName, 
    focusArea, 
    timesOfDay, 
    startTime,
    timeCommitment, 
    difficulty, 
    additionalDetails 
  } = req.body;

  // Strict Input Validation (The 6-Question Survey)
  if (
    !routineName || 
    !focusArea || 
    !timesOfDay || !timesOfDay.length || 
    !startTime || 
    !timeCommitment || 
    !difficulty || 
    additionalDetails === undefined
  ) {
    return res.status(400).json({ 
      error: 'Missing required survey fields. All 7 parameters must be provided.' 
    });
  }

  try {
    // Call the AI utility
    const generatedHabits = await generateRoutineFromAI({
      routineName, focusArea, timesOfDay, startTime, timeCommitment, difficulty, additionalDetails
    });

    // Prisma Transaction: Create Routine, Habits, Reminders, and Links safely
    const createdRoutine = await db.$transaction(async (tx) => {
      // Create the parent Routine
      const routine = await tx.routine.create({
        data: {
          userId: user.userId,
          routineName: String(routineName).trim(),
          status: 'Active',
        },
      });

      // Loop through AI-generated habits and create them in their separate tables
      for (let i = 0; i < generatedHabits.length; i++) {
        const aiHabit = generatedHabits[i];

        // Create the Habit
        const habit = await tx.habit.create({
          data: {
            userId: user.userId,
            habitName: String(aiHabit.title).trim(),
            frequencyType: 'Daily',
            status: 'Active',
          }
        });

        // Create the Reminder 
        await tx.reminder.create({
          data: {
            habitId: habit.habitId,
            reminderTime: normalizeReminderTimeForCron(aiHabit.reminderTime), 
            enabledStatus: true,
          }
        });

        // Link the Habit to the Routine using RoutineHabit join table
        await tx.routineHabit.create({
          data: {
            habitId: habit.habitId,
            routineId: routine.routineId,
            orderIndex: i, // Maintains the AI's suggested order
          }
        });
      }

      return routine;
    });

    // 5. Return Success
    return res.status(201).json({ 
      message: 'Routine successfully generated!',
      routine: routineToDto(createdRoutine) 
    });

  } catch (error) {
    console.error('AI Generation or DB Error:', error);
    return res.status(500).json({ error: 'Failed to generate and save routine.' });
  }
};

export { getHabits, getRoutines, createHabit, deleteHabit, updateHabit, createRoutine, deleteRoutine, updateRoutine, completeHabit, generateAIRoutine };
