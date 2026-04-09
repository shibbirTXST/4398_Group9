import express from 'express';
import authCheck from '../utils/authCheck.js';

const habitRouter = express.Router();
import { getHabits, createHabit, deleteHabit, updateHabit } from '../controllers/habitController.js';

habitRouter.get('/', authCheck, getHabits);
habitRouter.post('/', authCheck, createHabit);
habitRouter.put('/:id', authCheck, updateHabit);
habitRouter.delete('/:id', authCheck, deleteHabit);

export { habitRouter };
