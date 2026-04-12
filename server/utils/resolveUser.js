import db from '../db/db.js';

function placeholderEmail(uid) {
  const safe = String(uid).replace(/[^a-zA-Z0-9]/g, '_');
  return `firebase_${safe}@placeholder.local`;
}

/**
 * Upserts a User row from a Firebase-decoded ID token (req.user after authCheck).
 */
export async function upsertUserFromDecodedToken(decoded) {
  const firebaseUid = decoded.uid;
  const email = decoded.email || placeholderEmail(firebaseUid);
  const usernameBase = String(decoded.email || firebaseUid).split('@')[0] || 'user';

  return db.user.upsert({
    where: { firebaseUid },
    create: {
      firebaseUid,
      email,
      username: usernameBase.slice(0, 255),
    },
    update: decoded.email ? { email: decoded.email } : {},
  });
}

export async function findUserByFirebaseUid(firebaseUid) {
  return db.user.findUnique({ where: { firebaseUid } });
}
