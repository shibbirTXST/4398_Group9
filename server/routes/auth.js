import express from 'express';
import admin from '../firebaseAdmin.js';

const authRouter = express.Router();

authRouter.delete("/delete-account", async (req, res) => {

  try {

    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    const uid = decoded.uid;

    await admin.auth().deleteUser(uid);

    res.json({ message: "User deleted successfully" });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Failed to delete user" });

  }

});

export { authRouter };