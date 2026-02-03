import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";

describe("Authentication Integration Tests", () => {
  const testUser = {
    username: "testuser",
    email: "testuser@example.com",
    password: "Test@1234",
    confirmPassword: "Test@1234",
    role: "musician",
  };

  beforeAll(async () => {
    // Clean up the test user if it already exists
    await UserModel.deleteOne({ email: testUser.email });
  });

  afterAll(async () => {
    // Clean up the test user after tests
    await UserModel.deleteOne({ email: testUser.email });
  });

  describe("POST /api/auth/register", () => {
    test("should register a new user", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty(
        "message",
        "User registered successfully",
      );
    });
  });
});
