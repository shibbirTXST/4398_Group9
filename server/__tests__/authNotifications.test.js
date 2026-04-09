import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

jest.unstable_mockModule('../firebaseAdmin.js', () => {
  const mockAuth = { verifyIdToken: jest.fn() };
  return { default: { auth: () => mockAuth } };
});

jest.unstable_mockModule('../db/db.js', () => ({
  default: { user: { update: jest.fn() } },
}));

const admin = (await import('../firebaseAdmin.js')).default;
const db = (await import('../db/db.js')).default;
const { authRouter } = await import('../routes/auth.js');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('POST /api/auth/push-token', () => {
  beforeEach(() => {
    jest.clearAllMocks(); 
  });

  // The Happy Path
  it('should successfully save the push token and return 200', async () => {
    admin.auth().verifyIdToken.mockResolvedValue({ uid: 'fake-firebase-uid-123' });
    db.user.update.mockResolvedValue({ userId: 1, pushToken: 'ExpoPushToken[abcd]' });

    const response = await request(app)
      .post('/api/auth/push-token')
      .set('Authorization', 'Bearer valid-mock-token')
      .send({ pushToken: 'ExpoPushToken[abcd]' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Push token saved successfully' });
    expect(db.user.update).toHaveBeenCalledWith({
      where: { firebaseUid: 'fake-firebase-uid-123' },
      data: { pushToken: 'ExpoPushToken[abcd]' }
    });
  });

  // Missing Header
  it('should return 401 Unauthorized if no Authorization header is provided', async () => {
    const response = await request(app)
      .post('/api/auth/push-token')
      .send({ pushToken: 'ExpoPushToken[abcd]' }); 

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
    expect(db.user.update).not.toHaveBeenCalled();
  });

  // Missing Body Data
  it('should return 400 Bad Request if the pushToken is missing from the body', async () => {
    admin.auth().verifyIdToken.mockResolvedValue({ uid: 'fake-firebase-uid-123' });

    const response = await request(app)
      .post('/api/auth/push-token')
      .set('Authorization', 'Bearer valid-mock-token')
      .send({}); // Empty body

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Push token is required' });
  });

  // Malformed Header 
  it('should return 401 if the Authorization header does not start with Bearer', async () => {
    const response = await request(app)
      .post('/api/auth/push-token')
      .set('Authorization', 'Basic wrong-format-token') // Uses 'Basic' instead of 'Bearer'
      .send({ pushToken: 'ExpoPushToken[abcd]' });

    expect(response.status).toBe(401);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  // Firebase Rejection 
  it('should return 500 if Firebase rejects the token (e.g., expired or invalid)', async () => {
    // Force Firebase to throw an error
    admin.auth().verifyIdToken.mockRejectedValue(new Error('Firebase ID token has expired'));

    const response = await request(app)
      .post('/api/auth/push-token')
      .set('Authorization', 'Bearer expired-mock-token')
      .send({ pushToken: 'ExpoPushToken[abcd]' });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
    expect(db.user.update).not.toHaveBeenCalled(); // DB shouldn't run if Firebase fails
  });

  // Database Crash 
  it('should return 500 if the database fails to update the user', async () => {
    admin.auth().verifyIdToken.mockResolvedValue({ uid: 'fake-firebase-uid-123' });
    
    // Force the Prisma database connection to simulate a crash
    db.user.update.mockRejectedValue(new Error('Database connection lost'));

    const response = await request(app)
      .post('/api/auth/push-token')
      .set('Authorization', 'Bearer valid-mock-token')
      .send({ pushToken: 'ExpoPushToken[abcd]' });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
  });
});