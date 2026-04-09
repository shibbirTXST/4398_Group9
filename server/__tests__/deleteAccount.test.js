jest.mock("../firebaseAdmin");
jest.mock("../db/db.js", () => ({
  __esModule: true,
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

const request = require("supertest");
const app = require("../app");
const admin = require("../firebaseAdmin");

describe("DELETE /api/auth/delete-account", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should delete a user when given a valid token", async () => {
    admin.auth = jest.fn().mockReturnValue({
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
    admin.auth = jest.fn().mockReturnValue({
      verifyIdToken: jest.fn().mockRejectedValue(new Error("Invalid token")),
    });

    const res = await request(app)
      .delete("/api/auth/delete-account")
      .set("Authorization", "Bearer invalidToken");

    expect(res.statusCode).toBe(500);
  });
});
