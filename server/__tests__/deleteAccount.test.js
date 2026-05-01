import { jest } from '@jest/globals';

jest.unstable_mockModule("../firebaseAdmin.js", () => ({
  default: {
    auth: jest.fn(),
  },
}));

jest.unstable_mockModule("../db/db.js", () => ({
  default: {
    $transaction: jest.fn(async (fn) =>
      fn({
        user: {
          deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      })
    ),
  },
}));

const request = (await import("supertest")).default;
const app = (await import("../app.js")).default;
const admin = (await import("../firebaseAdmin.js")).default;

describe("DELETE /api/auth/delete-account", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should delete a user when given a valid token", async () => {
    admin.auth.mockReturnValue({
      verifyIdToken: jest.fn().mockResolvedValue({ uid: "testUID" }),
      deleteUser: jest.fn().mockResolvedValue(),
    });

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

  test("should return 500 if Firebase throws an error", async () => {
    admin.auth.mockReturnValue({
      verifyIdToken: jest.fn().mockRejectedValue(new Error("Invalid token")),
    });

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