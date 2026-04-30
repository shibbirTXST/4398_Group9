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

authRouter.delete('/delete-account', authCheck, async (req, res) => {
  try {
    const uid = req.user.uid; // Provided by authCheck middleware

    await db.$transaction(async (tx) => {
      // Ensure we delete by the Firebase UID associated with the verified token
      await tx.user.deleteMany({ where: { firebaseUid: uid } });
    });

    await admin.auth().deleteUser(uid);

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// push token route for saving Expo push tokens to the database
authRouter.post('/push-token', async (req, res) => {
  try {
    // Verify the Firebase token to make sure the user is actually logged in
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;

    // Grab the Expo push token sent from frontend
    const { pushToken } = req.body;
    if (!pushToken) {
      return res.status(400).json({ error: 'Push token is required' });
    }

    // Save it to the new column in the Prisma database
    await db.user.update({
      where: { firebaseUid: firebaseUid },
      data: { pushToken: pushToken }
    });

    res.status(200).json({ message: 'Push token saved successfully' });
  } catch (error) {
    console.error('Error saving push token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { authRouter };
