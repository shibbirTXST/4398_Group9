import express from 'express';
import authCheck from '../utils/authCheck.js';
import { getCurrentUser, updateCurrentUser } from '../controllers/userController.js';

const userRouter = express.Router();

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get the currently authenticated user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: integer
 *                   example: 1
 *                 firebaseUid:
 *                   type: string
 *                   example: abc123firebaseuid
 *                 username:
 *                   type: string
 *                   example: johndoe
 *                 email:
 *                   type: string
 *                   example: user@example.com
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *   patch:
 *     summary: Update the currently authenticated user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: newUsername
 *               profilePicUrl:
 *                 type: string
 *                 example: https://example.com/profile.jpg
 *               pushToken:
 *                 type: string
 *                 example: ExpoPushToken[xxxxxxxxxxxxxxxxxxxxxx]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid user data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
userRouter.get('/me', authCheck, getCurrentUser);
userRouter.patch('/me', authCheck, updateCurrentUser);

export { userRouter };
