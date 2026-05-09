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
  updateRoutine,
  completeHabit,
  generateAIRoutine
} from '../controllers/habitController.js';

const habitRouter = express.Router();

// --- HABIT ROUTES ---
/**
 * @swagger
 * /api/habits:
 *   get:
 *     summary: Fetch habits from server
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Habits fetched successfully
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Add a new habit to the server
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Habit created successfully
 *       400:
 *         description: Invalid habit data
 *       401:
 *         description: Unauthorized
 */
habitRouter.get('/', authCheck, getHabits);
habitRouter.post('/', authCheck, createHabit);
/**
 * @swagger
 * /api/habits/comp/{id}:
 *   put:
 *     summary: Mark a habit as complete
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Habit ID
 *     responses:
 *       200:
 *         description: Habit marked as complete successfully
 *       400:
 *         description: Habit already completed today or invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Habit not found
 */
habitRouter.put('/comp/:id', authCheck, completeHabit);
/**
 * @swagger
 * /api/habits/{id}:
 *   put:
 *     summary: Update an existing habit
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Habit ID
 *     responses:
 *       200:
 *         description: Habit updated successfully
 *       400:
 *         description: Invalid habit data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Habit not found
 *   delete:
 *     summary: Delete an existing habit
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Habit ID
 *     responses:
 *       200:
 *         description: Habit deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Habit not found
 */
habitRouter.put('/:id', authCheck, updateHabit);
habitRouter.delete('/:id', authCheck, deleteHabit);

// --- ROUTINE ROUTES ---

/**
 * @swagger
 * /api/habits/routines:
 *   get:
 *     summary: Fetch routines from server
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Routines fetched successfully
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Add a new routine to the server
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Routine created successfully
 *       400:
 *         description: Invalid routine data
 *       401:
 *         description: Unauthorized
 */
habitRouter.get('/routines', authCheck, getRoutines);
habitRouter.post('/routines', authCheck, createRoutine);
/**
 * @swagger
 * /api/habits/routines/generate:
 *   post:
 *     summary: Generate a routine using AI
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI routine generated successfully
 *       400:
 *         description: Invalid generation request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to generate AI routine
 */
habitRouter.post('/routines/generate', authCheck, generateAIRoutine);
/**
 * @swagger
 * /api/habits/routines/{id}:
 *   put:
 *     summary: Update an existing routine
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Routine ID
 *     responses:
 *       200:
 *         description: Routine updated successfully
 *       400:
 *         description: Invalid routine data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Routine not found
 *   delete:
 *     summary: Delete an existing routine
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Routine ID
 *     responses:
 *       200:
 *         description: Routine deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Routine not found
 */
habitRouter.put('/routines/:id', authCheck, updateRoutine);
habitRouter.delete('/routines/:id', authCheck, deleteRoutine);

export { habitRouter };