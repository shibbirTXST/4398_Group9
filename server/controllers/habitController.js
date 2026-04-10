let routines = [
  { ID: 1, title: 'Morning Routine' }
];

let habits = [
  { ID: 1, title: 'Drink Water', completed: false, count: 0, reminderTime: '08:00', routineID: 1 },
  { ID: 2, title: 'Read for 30 mins', completed: true, count: 1, reminderTime: '18:00', routineID: 0 },
  { ID: 3, title: 'Exercise', completed: false, count: 0, reminderTime: '19:00', routineID: 1 },
];

const getHabits = (req, res) => {
  res.status(200).json(habits);
};

const getRoutines = (req, res) => {
  res.status(200).json(routines);
};

//habit controller functions

const createHabit = (req, res) => {
  // authentication check
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Error Message Return: Unauthorized access. Please log in.' });
  }

  //check if request body exists
  if(!req.body) {
    return res.status(400).json({ error: 'Error Message Return: Request body is required' });
  }

  // class diagram variables
  const { title, reminderTime, accountID, routineID } = req.body;

  // input validation 
  if (!title || !reminderTime || !accountID || (!routineID && routineID !== 0)) {
    return res.status(400).json({ error: 'Error Message Return: Title, reminder time, account ID, and routine ID are required' });
  }

  const newHabit = { ID: Date.now(), title: title, completed: false, count: 0, reminderTime: reminderTime, routineID: routineID };
  habits.push(newHabit);

  // successful database save simulation
  res.status(201).json({
    message: 'Habit successfully created',
    habit: {
      ID: Date.now(),
      title: title,
      reminderTime: reminderTime,
      isCompleted: false, 
      accountID: accountID,
      routineID: routineID 
    }
  });
};

const deleteHabit = (req, res) => {
  //authentication check
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Error Message Return: Unauthorized access. Please log in.' });
  }
  //reading in
  const { ID } = req.params;
  //error handling for invalid id format
  if(isNaN(parseInt(ID))) {
    return res.status(400).json({ error: 'Error Message Return: Invalid habit ID' });
  }

  const index = habits.findIndex(h => h.ID == ID);
  //error handling for habit not found
  if (index === -1) {
    return res.status(404).json({ message: 'Habit not found' });
  }
  //deletion operation
  habits.splice(index, 1);
  res.status(200).json({ 
    message: 'Habit deleted',
    habitID: parseInt(ID)
   });
};

const updateHabit = (req, res) => {
  //authentication check
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Error Message Return: Unauthorized access. Please log in.' });
  }
  //reading in
  const { ID } = req.params;

  //check if request body exists
  if(!req.body) {
    return res.status(400).json({ error: 'Error Message Return: Request body is required' });
  }
  const { title, reminderTime, routineID } = req.body;

  //error handling for invalid id formats
  if(isNaN(parseInt(ID))) {
    return res.status(400).json({ error: 'Error Message Return: Invalid habit ID' });
  }
  if(isNaN(parseInt(routineID))) {
    return res.status(400).json({ error: 'Error Message Return: Invalid routine ID' });
  }

  //error handling for missing title and reminder time
  if(!title || !reminderTime || (!routineID && routineID !== 0)) {
    return res.status(400).json({ error: 'Error Message Return: Title, reminder time, and RoutineID are required' });
  }

  //error handling for id not found
  const index = habits.findIndex(h => h.ID == ID);
  if (index === -1) {
    return res.status(404).json({ message: 'Habit not found' });
  }
  
  //simulated update operation
  habits[index].title = title;
  habits[index].reminderTime = reminderTime;
  habits[index].routineID = routineID;
  res.status(200).json({habit: habits[index]});
};

//routine controller functions

const createRoutine = (req, res) => {
  // authentication check
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Error Message Return: Unauthorized access. Please log in.' });
  }
  //check if request body exists
  if(!req.body) {
    return res.status(400).json({ error: 'Error Message Return: Request body is required' });
  }

  const { title } = req.body;

  // input validation
  if (!title) {
    return res.status(400).json({ error: 'Error Message Return: Routine title is required' });
  }

  const newRoutine = { ID: Date.now(), title: title };
  routines.push(newRoutine);
  res.status(201).json({
    message: 'Routine successfully created',
    routine: newRoutine
  });
};

const deleteRoutine = (req, res) => {
  // authentication check
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Error Message Return: Unauthorized access. Please log in.' });
  }

  const { ID } = req.params;
  // error handling for invalid id format
  if(isNaN(parseInt(ID))) {
    return res.status(400).json({ error: 'Error Message Return: Invalid routine ID' });
  }

  const index = routines.findIndex(r => r.ID == ID);
  // error handling for routine not found
  if (index === -1) {
    return res.status(404).json({ message: 'Routine not found' });
  }

  // delete
  routines.splice(index, 1);
  while (habits.some(h => h.routineID == ID)) {
    const habitIndex = habits.findIndex(h => h.routineID == ID);
    habits.splice(habitIndex, 1);
  }

  res.status(200).json({ 
    message: 'Routine deleted',
    routineID: parseInt(ID),
    hasHabits: habits.some(h => h.routineID == ID)
  });
};

const updateRoutine = (req, res) => {
  // authentication check
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Error Message Return: Unauthorized access. Please log in.' });
  }
  //check if request body exists
  if(!req.body) {
    return res.status(400).json({ error: 'Error Message Return: Request body is required' });
  }

  const { ID } = req.params;
  const { title } = req.body;

  // error handling for invalid id format
  if(isNaN(parseInt(ID))) {
    return res.status(400).json({ error: 'Invalid routine ID format' });
  }

  // error handling for missing title
  if (!title) {
    return res.status(400).json({ error: 'Error Message Return: Routine title is required' });
  }

  const index = routines.findIndex(r => r.ID == ID);
  // error handling for routine not found
  if (index === -1) {
    return res.status(404).json({ message: 'Routine not found' });
  }

  // update
  routines[index].title = title;

  res.status(200).json({ 
    message: 'Routine successfully updated', 
    routineID: parseInt(ID),
    });
};

module.exports = { getHabits, getRoutines, createHabit, deleteHabit, updateHabit, createRoutine, deleteRoutine, updateRoutine };
