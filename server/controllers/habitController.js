// Exporting the arrays so your Notification Cron Job can import and read them!
export let routines = [
  { ID: 1, title: 'Morning Routine' }
];

export let habits = [
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

// --- HABIT CONTROLLERS ---
const createHabit = (req, res) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Unauthorized access. Please log in.' });
  }

  // check if request body exists
  if(!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Error Message Return: Request body is required' });
  }
  
  const { title, reminderTime, accountID, routineID } = req.body;

  // input validation 
  if (!title || !reminderTime || !accountID || (!routineID && routineID !== 0)) {
    return res.status(400).json({ error: 'Error Message Return: Title, reminder time, account ID, and routine ID are required' });
  }
  
  const newHabit = { 
    ID: Date.now(), 
    title: title, 
    completed: false, 
    count: 0, 
    reminderTime: reminderTime, 
    routineID: routineID 
  };
  
  habits.push(newHabit);
  res.status(201).json({ message: 'Habit successfully created', habit: newHabit });
};

const deleteHabit = (req, res) => {
  const id = req.params.ID || req.params.id;

  // error handling for invalid id format
  if(isNaN(parseInt(id))) {
    return res.status(400).json({ error: 'Error Message Return: Invalid habit ID' });
  }

  const index = habits.findIndex(h => String(h.ID) === String(id));
  
  // error handling for habit not found
  if (index === -1) {
    return res.status(404).json({ message: 'Habit not found' });
  }

  // delete operation
  habits.splice(index, 1);
  res.status(200).json({ message: 'Habit deleted' });
};

const updateHabit = (req, res) => {
  // authentication check
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Error Message Return: Unauthorized access. Please log in.' });
  }

  const id = req.params.ID || req.params.id;

  // check if request body exists
  if(!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Error Message Return: Request body is required' });
  }
  
  const { title, reminderTime, routineID } = req.body;

  // error handling for invalid id formats
  if(isNaN(parseInt(id))) {
    return res.status(400).json({ error: 'Error Message Return: Invalid habit ID' });
  }
  if(isNaN(parseInt(routineID))) {
    return res.status(400).json({ error: 'Error Message Return: Invalid routine ID' });
  }

  // error handling for missing fields
  if(!title || !reminderTime || (!routineID && routineID !== 0)) {
    return res.status(400).json({ error: 'Error Message Return: Title, reminder time, and RoutineID are required' });
  }

  // error handling for id not found
  const index = habits.findIndex(h => String(h.ID) === String(id));
  if (index === -1) {
    return res.status(404).json({ message: 'Habit not found' });
  }
  
  // update operation
  habits[index].title = title;
  habits[index].reminderTime = reminderTime;
  habits[index].routineID = routineID;
  res.status(200).json({ habit: habits[index] });
};

// --- ROUTINE CONTROLLERS ---

const createRoutine = (req, res) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Unauthorized access. Please log in.' });
  }
  
  const { title } = req.body;
  const newRoutine = { ID: Date.now(), title: title || 'New Routine' };
  
  routines.push(newRoutine);
  res.status(201).json({ message: 'Routine successfully created', routine: newRoutine });
};

const deleteRoutine = (req, res) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Unauthorized access. Please log in.' });
  }
  
  const id = req.params.ID || req.params.id;
  const index = routines.findIndex(r => String(r.ID) === String(id));
  
  if (index !== -1) {
    routines.splice(index, 1);
    
    // Clean up associated habits if a routine is deleted
    for (let i = habits.length - 1; i >= 0; i--) {
      if (String(habits[i].routineID) === String(id)) {
        habits.splice(i, 1);
      }
    }
  }
  
  res.status(200).json({ message: 'Routine deleted' });
};

const updateRoutine = (req, res) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Unauthorized access. Please log in.' });
  }
  
  const id = req.params.ID || req.params.id;
  const { title } = req.body;
  const index = routines.findIndex(r => String(r.ID) === String(id));
  
  if (index !== -1 && title) {
    routines[index].title = title;
  }
  
  res.status(200).json({ message: 'Routine successfully updated' });
};

export { getHabits, getRoutines, createHabit, deleteHabit, updateHabit, createRoutine, deleteRoutine, updateRoutine };