import express from 'express';
import authCheck from '../utils/authCheck.js';
import { 
  getHabits, 
  getRoutines, 
  createHabit, 
  deleteHabit, 
  updateHabit, 
  createRoutine, 
  deleteRoutine, 
  updateRoutine 
} from '../controllers/habitController.js';

const habitRouter = express.Router();

// --- HABIT ROUTES ---
habitRouter.get('/', authCheck, getHabits);
habitRouter.post('/', authCheck, createHabit);
habitRouter.put('/:id', authCheck, updateHabit);
habitRouter.delete('/:id', authCheck, deleteHabit);

// --- ROUTINE ROUTES ---
habitRouter.get('/routines', authCheck, getRoutines);
habitRouter.post('/routines', authCheck, createRoutine);
habitRouter.put('/routines/:id', authCheck, updateRoutine);
habitRouter.delete('/routines/:id', authCheck, deleteRoutine);

export { habitRouter };