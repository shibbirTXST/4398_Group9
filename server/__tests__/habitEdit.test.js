import request from 'supertest';
import { jest } from '@jest/globals';

// Mock Firebase Auth
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

// Mock User Resolver
jest.unstable_mockModule('../utils/resolveUser.js', () => ({
  findUserByFirebaseUid: jest.fn().mockResolvedValue({ userId: 1 }),
  upsertUserFromDecodedToken: jest.fn().mockResolvedValue({ userId: 1, firebaseUid: 'test-uid' }),
}));

// Mock Database to bypass Prisma TypeScript parsing issues
jest.unstable_mockModule('../db/db.js', () => ({
  default: {
    routine: {
      findFirst: jest.fn(),
    },
    habit: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Import modules AFTER mocks are defined
const db = (await import('../db/db.js')).default;
const { default: app } = await import('../app.js');

describe('Habit Modification API (PUT /api/habits/:id)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress expected console.error logs for 400/401/404 errors
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // test case 1: correct path
  it('should update the habit and return the updated habit when the user is logged in', async () => {
    const habitID = 2;
    const updatedTitle = 'Read for 1 hour';
    const updatedReminderTime = '20:00';
    const RoutineID = 1;

    // Mock the DB check to pretend the habit and routine exist
    db.habit.findFirst.mockResolvedValue({ habitId: 2, userId: 1 });
    db.routine.findFirst.mockResolvedValue({ routineId: 1, userId: 1 });
    
    // Mock the DB update result
    const updatedHabitMock = {
      habitId: habitID,
      userId: 1,
      habitName: updatedTitle,
      reminders: [{ reminderTime: updatedReminderTime }],
      routineHabits: [{ routineId: RoutineID }],
      logs: []
    };
    // Mock findFirst to return the complete object for both the check and the final response
    db.habit.findFirst.mockResolvedValue(updatedHabitMock);
    db.routine.findFirst.mockResolvedValue({ routineId: RoutineID, userId: 1 });

    db.habit.update.mockResolvedValue(updatedHabitMock);
    
    // Mock transaction in case the controller uses Prisma transactions
    db.$transaction.mockImplementation(async (callback) => {
      const tx = {
        habit: { update: jest.fn().mockResolvedValue(updatedHabitMock) },
        reminder: { deleteMany: jest.fn(), create: jest.fn() },
        routineHabit: { deleteMany: jest.fn(), create: jest.fn() },
      };
      await callback(tx);
      return updatedHabitMock;
    });

    const response = await request(app)
      .put(`/api/habits/${habitID}`)
      .set('Authorization', 'Bearer valid-firebase-token') // triggers the "yes" path
      .send({ title: updatedTitle, reminderTime: updatedReminderTime, routineID: RoutineID });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('habit');
    expect(String(response.body.habit.ID)).toEqual(String(habitID));
    expect(response.body.habit.title).toBe(updatedTitle);
    expect(response.body.habit.reminderTime).toBe(updatedReminderTime);
    expect(response.body.habit.routineID).toBe(RoutineID);
  });
  
  // test case 2: error handling - habit not found
  it('should return 404 Not Found if the habit does not exist', async () => {
    const nonExistentHabitID = 9999;
    const updatedTitle = 'Some Title';
    const updatedReminderTime = '20:00';
    const RoutineID = 1;

    // Return null to simulate not found
    db.habit.findFirst.mockResolvedValue(null);

    const response = await request(app)
      .put(`/api/habits/${nonExistentHabitID}`)
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({ title: updatedTitle, reminderTime: updatedReminderTime, routineID: RoutineID });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Habit not found');
  });
  
  // test case 3: error handling - user not logged in
  it('should block the update operation and return an error if the user is not logged in', async () => {
    const habitID = 2;
    const response = await request(app)
      .put(`/api/habits/${habitID}`)
      // intentionally trigger the "No" path by NOT setting the Authorization header
      .send({ title: 'Test', reminderTime: '20:00', routineID: 1 });

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
  });

  // test case 4: error handling - missing title in request body
  it('should return an error if the title is missing in the request body', async () => {
    const response = await request(app)
      .put(`/api/habits/2`)
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({ reminderTime: '20:00', routineID: 1 }); // no title provided

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  // test case 5: error handling - missing reminder time in request body
  it('should return an error if the reminder time is missing in the request body', async () => {
    const response = await request(app)
      .put(`/api/habits/2`)
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({ title: 'Read', routineID: 1 }); // no reminder time provided

    expect(response.status).toBe(400); 
    expect(response.body.error).toBeDefined();
  });

  // test case 6: error handling - missing routine ID in request body
  it('should return an error if the routine ID is missing in the request body', async () => {
    const response = await request(app)
      .put(`/api/habits/2`)
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({ title: 'Read', reminderTime: '20:00' }); // no routine ID provided

    expect(response.status).toBe(400); 
    expect(response.body.error).toBeDefined();
  });

  // test case 7: error handling - invalid routine ID in request body
  it('should return an error if the routine ID is invalid in the request body', async () => {
    const response = await request(app)
      .put(`/api/habits/2`)
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({ title: 'Read', reminderTime: '20:00', routineID: 'invalid-routine-id' }); 

    expect(response.status).toBe(400); 
    expect(response.body.error).toBeDefined(); 
  });

  // test case 8: error handling - invalid habit ID
  it('should return an error if the habit ID is invalid', async () => {
    const response = await request(app)
      .put(`/api/habits/invalid-id`)
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({ title: 'Read', reminderTime: '20:00', routineID: 1 });

    expect(response.status).toBe(400); 
    expect(response.body.error).toBeDefined(); 
  });

  // test case 9: error handling - user not logged in and missing title
  it('should return an error when the user is not logged in and the title is missing in the request body', async () => {
    const response = await request(app)
      .put(`/api/habits/2`)
      .send({ reminderTime: '20:00', routineID: 1 }); // no title provided

    expect(response.status).toBe(401); 
    expect(response.body.error).toBeDefined(); 
  });

  // test case 10: missing fields and logged out
  it('should return an error when the user is not logged in and required fields are missing in the request body', async () => {
    const response = await request(app)
      .put(`/api/habits/2`)
      .send(); // no fields provided

    expect(response.status).toBe(401); 
    expect(response.body.error).toBeDefined();
  });

  // test case 12: error handling - user logged in but missing fields
  it('should return an error when the user is logged in but required fields are missing in the request body', async () => {
    const response = await request(app)
      .put(`/api/habits/2`)
      .set('Authorization', 'Bearer valid-firebase-token')
      .send(); // no fields provided

    expect(response.status).toBe(400); 
    expect(response.body.error).toBeDefined();
  });
});