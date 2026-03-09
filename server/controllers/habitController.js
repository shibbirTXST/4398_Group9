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
  res.status(201).json(newHabit);
};

const deleteHabit = (req, res) => {
  const { id } = req.params;
  const index = habits.findIndex(h => h.id == id);
  if (index === -1) {
    return res.status(404).json({ message: 'Habit not found' });
  }
  habits.splice(index, 1);
  res.status(200).json({ message: 'Habit deleted' });
};

const updateHabit = (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  const index = habits.findIndex(h => h.id == id);
  if (index === -1) {
    return res.status(404).json({ message: 'Habit not found' });
  }
  habits[index].title = title;
  res.status(200).json(habits[index]);
};

module.exports = { getHabits, createHabit, deleteHabit, updateHabit };
