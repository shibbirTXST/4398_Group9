const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Habit Tracker API' });
});

const habitRoutes = require('./routes/habitRoutes');
app.use('/api/habits', habitRoutes);

module.exports = app;
