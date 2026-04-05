import express from 'express';

const habitRouter = express.Router();
import { getHabits, createHabit, deleteHabit, updateHabit } from '../controllers/habitController.js';

habitRouter.get('/', getHabits);
habitRouter.post('/', createHabit);
habitRouter.put('/:id', updateHabit);
habitRouter.delete('/:id', deleteHabit);

export { habitRouter };
