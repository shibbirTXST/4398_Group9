const express = require('express');
const router = express.Router();
const { getHabits, createHabit } = require('../controllers/habitController');

router.get('/', getHabits);
router.post('/', createHabit);

module.exports = router;
