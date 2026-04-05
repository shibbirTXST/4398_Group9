import admin from 'firebase-admin';
import serviceAccount from './config/serviceAccountKey.json' with { type: 'json' };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export default admin;