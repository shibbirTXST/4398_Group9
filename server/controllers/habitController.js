import admin from '../firebaseAdmin.js';
import db from '../db/db.js';

const getHabits = (req, res) => {

  const rUserId = req.user.uid; // Assuming authCheck middleware attaches uid to req.user

  // Fetch habits from the database for the authenticated user
  const habits = db.habits.findMany({
    where: {
      userId: rUserId,
    },
    select: {
      habitId: true,
      habitName: true,
      status: true,
      frequencyType: true,
    }
  });
  res.status(200).json(habits);
};

const createHabit = (req, res) => {
  const rUserId = req.user.uid;

  // class diagram variables
  const { habitName, userId, planID } = req.body;

  // // input validation 
  // if (!taskName && !reminderTime) {
  //   return res.status(400).json({ error: 'Task name and reminder time are required' });
  // }

  // if (!taskName) {
  //   return res.status(400).json({ error: 'Task name is required' });
  // }
  // if (!reminderTime) {
  //   return res.status(400).json({ error: 'Reminder time is required' });
  // }



  // successful database save simulation
  res.status(201).json({
    message: 'Task successfully created',
    task: {
      taskID: Date.now(),
      taskName: taskName,
      reminderTime: reminderTime,
      isCompleted: false,
      accountID: accountID,
      planID: planID
    }
  });
};

const deleteHabit = (req, res) => {
  //authentication check
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Error Message Return: Unauthorized access. Please log in.' });
  }
  //reading in
  const { id } = req.params;
  const index = habits.findIndex(h => h.id == id);
  //error handling for invalid id format
  if (id != parseInt(id)) {
    return res.status(400).json({ error: 'Error Message Return: Invalid habit ID' });
  }
  //error handling for habit not found
  if (index === -1) {
    return res.status(404).json({ message: 'Habit not found' });
  }
  //deletion operation
  habits.splice(index, 1);
  res.status(200).json({ message: 'Habit deleted' });
};

const updateHabit = (req, res) => {
  //authentication check
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Error Message Return: Unauthorized access. Please log in.' });
  }
  //reading in
  const { id } = req.params;
  const { title } = req.body;

  //error handling for invalid id format
  if (id != parseInt(id)) {
    return res.status(400).json({ error: 'Error Message Return: Invalid habit ID' });
  }

  //error handling for missing title
  if (!title) {
    return res.status(400).json({ error: 'Error Message Return: Title is required' });
  }
  //error handling for id not found
  const index = habits.findIndex(h => h.id == id);
  if (index === -1) {
    return res.status(404).json({ message: 'Habit not found' });
  }
  //update operation
  habits[index].title = title;
  res.status(200).json(habits[index]);
};

export { getHabits, createHabit, deleteHabit, updateHabit };
