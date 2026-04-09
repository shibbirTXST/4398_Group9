import express from 'express';
import { getUsers, getUserById, createUser } from '../controllers/userController.js';

const userRouter = express.Router();

// Basic user CRUD
userRouter.get('/', getUsers);
userRouter.get('/:id', getUserById);
userRouter.post('/', createUser);
// userRouter.put('/:id',);
// userRouter.delete('/:id',)

export { userRouter };