import request from 'supertest';
import { jest } from '@jest/globals';

jest.unstable_mockModule('../firebaseAdmin.js', () => {
  const mockAuth = {
    verifyIdToken: jest.fn(),
    deleteUser: jest.fn(),
  };
  return { default: { auth: () => mockAuth } };
});

jest.unstable_mockModule("../db/db.js", () => ({
  default: {
    $transaction: jest.fn(), // We will mock this dynamically in tests
  },
}));

const admin = (await import('../firebaseAdmin.js')).default;
const db = (await import('../db/db.js')).default;
const { default: app } = await import('../app.js');

describe("DELETE /api/auth/delete-account", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test("should delete a user when given a valid token", async () => {
    admin.auth().verifyIdToken.mockResolvedValue({ uid: "testUID" });
    admin.auth().deleteUser.mockResolvedValue();
    db.$transaction.mockImplementation(async (fn) => 
      fn({ user: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) } })
    );

    const res = await request(app)
      .delete("/api/auth/delete-account")
      .set("Authorization", "Bearer validToken");

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("User deleted successfully");
  });

  test("should return 401 if no token is provided", async () => {
    const res = await request(app).delete("/api/auth/delete-account");
    expect(res.statusCode).toBe(401);
  });

  // Pass authCheck first, then fail the deletion logic to trigger 500
  test("should return 500 if the deletion process fails", async () => {
    // 1. Mock a valid token to bypass the authCheck middleware
    admin.auth().verifyIdToken.mockResolvedValue({ uid: "testUID" });

    // 2. Mock a failure in the actual deletion logic to trigger the route's try/catch
    admin.auth().deleteUser.mockRejectedValue(new Error("Firebase service failure"));

    const res = await request(app)
      .delete("/api/auth/delete-account")
      .set("Authorization", "Bearer validToken");

    // 3. Now it should reach your catch block and return 500
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe("Failed to delete user");
  });
});