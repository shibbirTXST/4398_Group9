import express from 'express';
import cors from 'cors';

import { habitRouter } from './routes/habitRoutes.js';
import { authRouter } from './routes/auth.js';

const app = express();

app.use(cors());
app.use(express.json());

/* Routes */
app.use('/api/auth', authRouter);
app.use('/api/habits', habitRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Habit Tracker API' });
});


export default app;
