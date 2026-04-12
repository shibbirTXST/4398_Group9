import express from 'express';
import authCheck from '../utils/authCheck.js';
import { getCurrentUser, updateCurrentUser } from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.get('/me', authCheck, getCurrentUser);
userRouter.patch('/me', authCheck, updateCurrentUser);

export { userRouter };
