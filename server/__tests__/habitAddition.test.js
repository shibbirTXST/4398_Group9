import request from 'supertest';
import { jest } from '@jest/globals';

// 1. Mock Firebase Auth
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

// 2. Mock User Resolver
jest.unstable_mockModule('../utils/resolveUser.js', () => ({
  findUserByFirebaseUid: jest.fn().mockResolvedValue({ userId: 1, firebaseUid: 'test-uid' }),
  upsertUserFromDecodedToken: jest.fn().mockResolvedValue({ userId: 1, firebaseUid: 'test-uid' })
}));

// 3. Mock the Database to bypass Prisma TypeScript errors
jest.unstable_mockModule('../db/db.js', () => ({
  default: {
    routine: {
      findFirst: jest.fn().mockResolvedValue({ routineId: 1, userId: 1 }) // Mocks routine validation
    },
    $transaction: jest.fn().mockImplementation(async (callback) => {
      const tx = {
        habit: { create: jest.fn().mockResolvedValue({ habitId: 10, habitName: 'Drink Water' }) },
        reminder: { create: jest.fn().mockResolvedValue({}) },
        routineHabit: { create: jest.fn().mockResolvedValue({}) },
      };
      return callback(tx);
    }),
    habit: {
      findFirst: jest.fn().mockResolvedValue({
        habitId: 10,
        habitName: 'Drink Water',
        reminders: [{ reminderTime: '08:00 AM' }],
        routineHabits: [{ routineId: 1 }],
        logs: [] // Empty logs means completed: false
      })
    }
  }
}));

// 4. Dynamically import app.js AFTER mocks
const { default: app } = await import('../app.js');

describe('Habit Addition API (POST /api/habits)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress expected console.error logs for 400/401 errors
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // test case 1: correct path
  it('should save the habit and return success when the user is logged in', async () => {
    const newHabit = {
      title: 'Drink Water',
      reminderTime: '08:00 AM',
      accountID: 1,
      routineID: 1
    };

    const response = await request(app)
      .post('/api/habits')
      .set('Authorization', 'Bearer valid-firebase-token') // triggers the "yes" path
      .send(newHabit);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Habit successfully created'); // validates "return" state
    expect(response.body.habit).toHaveProperty('ID'); // validates class attributes
    expect(response.body.habit.title).toBe('Drink Water');
    expect(response.body.habit.completed).toBe(false);
  });

  // test case 2: error handling
  it('should block the save operation and return an error if the user is not logged in', async () => {
    const newHabit = {
      title: 'Read a Book',
      reminderTime: '09:00 PM',
      accountID: 2,
      routineID: 2
    };

    const response = await request(app)
      .post('/api/habits')
      // intentionally trigger the "No" path
      .send(newHabit);

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined(); // validates "Error Message" state
  });

  // test case 3: input validation 
  it('should return 400 Bad Request if the title is missing', async () => {
    const incompleteHabit = {
      // intentionally leaving out title
      reminderTime: '10:00 AM',
      accountID: 1,
      routineID: 1
    };

    const response = await request(app)
      .post('/api/habits')
      .set('Authorization', 'Bearer valid-firebase-token') // user IS logged in
      .send(incompleteHabit);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Error Message'); 
  });

  // test case 4: input validation 
  it('should return 400 Bad Request if the reminderTime is missing', async () => {
    const incompleteHabit = {
      // intentionally leaving out reminderTime 
      title: 'Go to the gym',
      accountID: 1,
      routineID: 1
    };

    const response = await request(app)
      .post('/api/habits')
      .set('Authorization', 'Bearer valid-firebase-token') // user IS logged in
      .send(incompleteHabit);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Error Message'); 
  });

  // test case 5: input validation 
  it('should return 400 Bad Request if the fields are missing', async () => {
    const incompleteHabit = {
      // intentionally leaving out reminderTime and title
      accountID: 1,
      routineID: 1
    };

    const response = await request(app)
      .post('/api/habits')
      .set('Authorization', 'Bearer valid-firebase-token') // user IS logged in
      .send(incompleteHabit);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Error Message'); 
  });

  //test case 6: missing request body
  it('should return 400 Bad Request if the request body is missing', async () => {
    const response = await request(app)
      .post('/api/habits')
      .set('Authorization', 'Bearer valid-firebase-token') // user IS logged in
      // intentionally leaving out the request body
      .send();

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Error Message'); 
  });

  //test case 7: missing routineID
  it('should return 400 Bad Request if the routineID is missing', async () => {
    const incompleteHabit = {
      title: 'Meditate',
      reminderTime: '07:00 AM',
      accountID: 1,
      // intentionally leaving out routineID
    };

    const response = await request(app)
      .post('/api/habits')
      .set('Authorization', 'Bearer valid-firebase-token') // user IS logged in
      .send(incompleteHabit);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Error Message'); 
  });
});