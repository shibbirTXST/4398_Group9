const getHabits = (req, res) => {
  const habits = [
    { id: 1, title: 'Drink Water', completed: false, count: 0 },
    { id: 2, title: 'Read for 30 mins', completed: true, count: 1 },
    { id: 3, title: 'Exercise', completed: false, count: 0 },
  ];
  res.status(200).json(habits);
};

const createHabit = (req, res) => {
  // authentication check
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Error Message Return: Unauthorized access. Please log in.' });
  }

  // class diagram variables
  const { taskName, reminderTime, accountID, planID } = req.body;

  // input validation 
  if (!taskName && !reminderTime) {
    return res.status(400).json({ error: 'Task name and reminder time are required' });
  }
  
  if (!taskName) {
    return res.status(400).json({ error: 'Task name is required' });
  }
  if (!reminderTime) {
    return res.status(400).json({ error: 'Reminder time is required' });
  }

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

module.exports = { getHabits, createHabit };

