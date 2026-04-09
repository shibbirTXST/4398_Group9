import express from 'express';
import admin from '../firebaseAdmin.js';
import db from '../db/db.js';
import authCheck from '../utils/authCheck.js';
import { upsertUserFromDecodedToken } from '../utils/resolveUser.js';

const authRouter = express.Router();

authRouter.post('/sync', authCheck, async (req, res) => {
  try {
    const user = await upsertUserFromDecodedToken(req.user);
    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

authRouter.delete('/delete-account', async (req, res) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;

    await db.$transaction(async (tx) => {
      await tx.user.deleteMany({ where: { firebaseUid: uid } });
    });

    await admin.auth().deleteUser(uid);

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export { authRouter };
