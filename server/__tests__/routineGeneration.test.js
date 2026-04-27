import request from 'supertest';
import { jest } from '@jest/globals';

// Use unstable_mockModule for the ESM environment
jest.unstable_mockModule('../firebaseAdmin.js', () => ({
  default: {
    auth: () => ({
      verifyIdToken: jest.fn().mockResolvedValue({
        uid: 'test-uid',
        email: 'user@test.com',
      }),
    }),
  },
}));

jest.unstable_mockModule('../utils/aiGenerator.js', () => ({
  generateRoutineFromAI: jest.fn().mockResolvedValue([
    { title: 'Drink Water', reminderTime: '08:00' },
    { title: 'Review Goals', reminderTime: '08:15' }
  ])
}));

jest.unstable_mockModule('../utils/resolveUser.js', () => ({
  findUserByFirebaseUid: jest.fn().mockResolvedValue({ userId: 1, firebaseUid: 'test-uid' }),
  upsertUserFromDecodedToken: jest.fn().mockResolvedValue({ userId: 1, firebaseUid: 'test-uid' })
}));

jest.unstable_mockModule('../db/db.js', () => ({
  default: {
    $transaction: jest.fn().mockImplementation(async (callback) => {
      const tx = {
        routine: { create: jest.fn().mockResolvedValue({ routineId: 1, routineName: 'Morning Kickstart' }) },
        habit: { create: jest.fn().mockResolvedValue({ habitId: 10 }) },
        reminder: { create: jest.fn().mockResolvedValue({}) },
        routineHabit: { create: jest.fn().mockResolvedValue({}) },
      };
      return callback(tx);
    })
  }
}));

// Dynamically import app.js AFTER the unstable_mockModules are defined
const { default: app } = await import('../app.js');

// Test Suite
describe('AI Routine Generation API (POST /api/habits/routines/generate)', () => {

  it('should generate a routine, save to DB, and return 201 with full survey data', async () => {
    const surveyData = {
      routineName: 'Morning Kickstart',
      focusArea: 'Productivity',
      timesOfDay: ['Morning'],
      timeCommitment: '30 mins',
      difficulty: 'Beginner',
      additionalDetails: 'I want to feel energized'
    };

    const response = await request(app)
      .post('/api/habits/routines/generate') // <-- Updated URL
      .set('Authorization', 'Bearer valid-firebase-token')
      .send(surveyData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message');
    expect(response.body.routine.title).toBe('Morning Kickstart'); 
  });

  it('should return 400 Bad Request if any of the 6 survey fields are missing', async () => {
    const incompleteData = {
      routineName: 'Incomplete Routine',
      focusArea: 'Fitness',
      // Intentionally missing timesOfDay, timeCommitment, difficulty, and additionalDetails
    };

    const response = await request(app)
      .post('/api/habits/routines/generate') // <-- Updated URL
      .set('Authorization', 'Bearer valid-firebase-token')
      .send(incompleteData);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Missing required survey fields');
  });

  it('should return 401 Unauthorized if no Firebase token is provided', async () => {
    const response = await request(app)
      .post('/api/habits/routines/generate') // <-- Updated URL
      .send({ 
        routineName: 'Test', 
        focusArea: 'Other',
        timesOfDay: ['Morning'],
        timeCommitment: '15 mins',
        difficulty: 'Beginner',
        additionalDetails: 'None'
      });

    expect(response.status).toBe(401);
  });
});