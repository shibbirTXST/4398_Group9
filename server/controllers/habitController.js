let plans = [
  { id: 1, name: 'Morning Routine' }
];

let habits = [
  { id: 1, title: 'Drink Water', completed: false, count: 0, reminderTime: '08:00', planID: 1 },
  { id: 2, title: 'Read for 30 mins', completed: true, count: 1, reminderTime: '18:00', planID: 0 },
  { id: 3, title: 'Exercise', completed: false, count: 0, reminderTime: '19:00', planID: 1 },
];

const getHabits = (req, res) => {
  res.status(200).json(habits);
};

const getPlans = (req, res) => {
  res.status(200).json(plans);
};

//habit controller functions

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
  const newHabit = { id: Date.now(), title: taskName, completed: false, count: 0, reminderTime: reminderTime };
  habits.push(newHabit);

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
  if(id != parseInt(id)) {
    return res.status(400).json({ error: 'Error Message Return: Invalid habit ID' });
  }
  //error handling for habit not found
  if (index === -1) {
    return res.status(404).json({ message: 'Habit not found' });
  }
  //deletion operation
  habits.splice(index, 1);
  res.status(200).json({ 
    message: 'Habit deleted',
    habitId: parseInt(id)
   });
};

const updateHabit = (req, res) => {
  //authentication check
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Error Message Return: Unauthorized access. Please log in.' });
  }
  //reading in
  const { id } = req.params;
  const { title, reminderTime, planID } = req.body;

  //error handling for invalid id format
  if(id != parseInt(id)) {
    return res.status(400).json({ error: 'Error Message Return: Invalid habit ID' });
  }

  //error handling for missing title and reminder time
  if(!title || !reminderTime) {
    return res.status(400).json({ error: 'Error Message Return: Title and reminder time are required' });
  }
  //error handling for id not found
  const index = habits.findIndex(h => h.id == id);
  if (index === -1) {
    return res.status(404).json({ message: 'Habit not found' });
  }
  
  //simulated update operation
  habits[index].title = title;
  habits[index].reminderTime = reminderTime;
  habits[index].planID = planID;
  res.status(200).json(habits[index]);
};

//plan controller functions

const createPlan = (req, res) => {
  // authentication check
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Error Message Return: Unauthorized access. Please log in.' });
  }
  const { name } = req.body;

  // input validation
  if (!name) {
    return res.status(400).json({ error: 'Error Message Return: Plan name is required' });
  }

  const newPlan = { id: Date.now(), name: name };
  plans.push(newPlan);
  res.status(201).json({
    message: 'Plan successfully created',
    plan: newPlan
  });
};

const deletePlan = (req, res) => {
  // authentication check
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Error Message Return: Unauthorized access. Please log in.' });
  }

  const { id } = req.params;
  // error handling for invalid id format
  if(id != parseInt(id)) {
    return res.status(400).json({ error: 'Error Message Return: Invalid plan ID' });
  }

  const index = plans.findIndex(p => p.id == id);
  // error handling for plan not found
  if (index === -1) {
    return res.status(404).json({ message: 'Plan not found' });
  }

  // delete
  plans.splice(index, 1);
  while (habits.some(h => h.planID == id)) {
    const habitIndex = habits.findIndex(h => h.planID == id);
    habits.splice(habitIndex, 1);
  }

  res.status(200).json({ 
    message: 'Plan deleted',
    planId: parseInt(id),
    hasHabits: habits.some(h => h.planID == id)
  });
};

const updatePlan = (req, res) => {
  // authentication check
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Error Message Return: Unauthorized access. Please log in.' });
  }

  const { id } = req.params;
  const { name } = req.body;

  // error handling for invalid id format
  if(id != parseInt(id)) {
    return res.status(400).json({ error: 'Invalid plan ID format' });
  }

  // error handling for missing name
  if (!name) {
    return res.status(400).json({ error: 'Error Message Return: Plan name is required' });
  }

  const index = plans.findIndex(p => p.id == id);
  // error handling for plan not found
  if (index === -1) {
    return res.status(404).json({ message: 'Plan not found' });
  }

  // update
  plans[index].name = name;

  res.status(200).json({ 
    message: 'Plan successfully updated', 
    planId: parseInt(id),
    });
};

module.exports = { getHabits, getPlans, createHabit, deleteHabit, updateHabit, createPlan, deletePlan, updatePlan };
