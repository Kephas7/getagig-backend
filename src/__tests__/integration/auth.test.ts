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
    await UserModel.deleteMany({ email: { $in: [testUser.email, "other@example.com"] } });
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: { $in: [testUser.email, "other@example.com"] } });
  });

  describe("POST /api/auth/register", () => {
    test("should register a new user", async () => {
      await UserModel.deleteOne({ email: testUser.email });
      const response = await request(app)
        .post("/api/auth/register")
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User registered successfully");
    });

    test("should not register a user with an already registered email", async () => {
      // Ensure user exists
      const existingUser = await UserModel.findOne({ email: testUser.email });
      if (!existingUser) {
        await request(app).post("/api/auth/register").send(testUser);
      }

      const response = await request(app)
        .post("/api/auth/register")
        .send(testUser);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Email already registered.");
    });

    test("should not register a user with mismatched passwords", async () => {
      const invalidUser = { ...testUser, email: "other@example.com", confirmPassword: "wrongpassword" };
      const response = await request(app)
        .post("/api/auth/register")
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Validation Error");
    });

    test("should not register a user with an already registered username", async () => {
      const duplicateUsernameUser = {
        ...testUser,
        email: "other@example.com",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(duplicateUsernameUser);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Username already registered.");
    });

    test("should not register a user with invalid email", async () => {
      const invalidEmailUser = {
        ...testUser,
        email: "not-an-email",
        username: "invalidemailuser",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(invalidEmailUser);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Validation Error");
    });

  });

  describe("POST /api/auth/login", () => {
    test("should login an existing user", async () => {
      // Ensure user exists
      const existingUser = await UserModel.findOne({ email: testUser.email });
      if (!existingUser) {
        await request(app).post("/api/auth/register").send(testUser);
      }

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("token");
    });

    test("should not login with incorrect password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: "WrongPassword123",
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid credentials");
    });

    test("should not login with non-existent email", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "SomePassword123",
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("User not found.");
    });

    test("should fail login validation when password is missing", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Validation Error");
    });
  });

  describe("GET /api/auth/me", () => {
    test("should return current user for a valid token", async () => {
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      const token = loginResponse.body.data.token;

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUser.email);
    });

    test("should reject unauthenticated requests to current user endpoint", async () => {
      const response = await request(app).get("/api/auth/me");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Unauthorized, No Bearer Token");
    });
  });
});


