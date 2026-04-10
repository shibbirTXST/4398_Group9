const express = require('express');
const router = express.Router();
const { getHabits, getRoutines, createHabit, deleteHabit, updateHabit, createRoutine, deleteRoutine, updateRoutine } = require('../controllers/habitController');

router.get('/', getHabits);
router.post('/', createHabit);
router.put('/:ID', updateHabit);
router.delete('/:ID', deleteHabit);

router.get('/routines', getRoutines);
router.post('/routines', createRoutine);
router.put('/routines/:ID', updateRoutine);
router.delete('/routines/:ID', deleteRoutine);

module.exports = router;
