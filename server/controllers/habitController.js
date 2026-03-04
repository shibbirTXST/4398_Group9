const getHabits = (req, res) => {
  const habits = [
    { id: 1, title: 'Drink Water', completed: false, count: 0 },
    { id: 2, title: 'Read for 30 mins', completed: true, count: 1 },
    { id: 3, title: 'Exercise', completed: false, count: 0 },
  ];
  res.status(200).json(habits);
};

const createHabit = (req, res) => {
  const { title } = req.body;
  const newHabit = { id: Date.now(), title, completed: false, count: 0 };
  res.status(201).json(newHabit);
};

module.exports = { getHabits, createHabit };
