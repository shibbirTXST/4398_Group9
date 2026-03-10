let habits = [
  { id: 1, title: 'Drink Water', completed: false, count: 0 },
  { id: 2, title: 'Read for 30 mins', completed: true, count: 1 },
  { id: 3, title: 'Exercise', completed: false, count: 0 },
];

const getHabits = (req, res) => {
  res.status(200).json(habits);
};

const createHabit = (req, res) => {
  const { title } = req.body;
  const newHabit = { id: Date.now(), title, completed: false, count: 0 };
  habits.push(newHabit);
  res.status(201).json({ message: 'Task successfully created', task: newHabit });
};

const deleteHabit = (req, res) => {
  //authentication check
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Error Message Return: Unauthorized access. Please log in.' });
  }

  //reading in
  const { id } = req.params;
  const index = habits.findIndex(h => h.id == id);
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

  //error handling for missing title
  if(!title) {
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

module.exports = { getHabits, createHabit, deleteHabit, updateHabit };
