const express = require('express');
const router = express.Router();
const { getHabits, getPlans, createHabit, deleteHabit, updateHabit, createPlan, deletePlan, updatePlan } = require('../controllers/habitController');

router.get('/', getHabits);
router.post('/', createHabit);
router.put('/:id', updateHabit);
router.delete('/:id', deleteHabit);

router.get('/plans', getPlans); // Placeholder for fetching Plans, to be implemented in the future
router.post('/plans', createPlan); // Placeholder for creating a plan, to be implemented in the future
router.put('/plans/:id', updatePlan); // Placeholder for updating a plan, to be implemented in the future
router.delete('/plans/:id', deletePlan); // Placeholder for deleting a plan, to be implemented in the future

module.exports = router;
