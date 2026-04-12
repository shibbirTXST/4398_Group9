import db from '../db/db.js';

const getCurrentUser = async (req, res) => {
  try {
    const user = await db.user.findUnique({
      where: { firebaseUid: req.user.uid },
    });
    if (!user) {
      return res.status(404).json({
        error: 'User not found. Call POST /api/auth/sync first.',
      });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateCurrentUser = async (req, res) => {
  const { username } = req.body;
  if (username == null || typeof username !== 'string' || !username.trim()) {
    return res.status(400).json({ error: 'username is required' });
  }

  try {
    const user = await db.user.update({
      where: { firebaseUid: req.user.uid },
      data: { username: username.trim() },
    });
    res.status(200).json(user);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'User not found. Call POST /api/auth/sync first.',
      });
    }
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export { getCurrentUser, updateCurrentUser };
