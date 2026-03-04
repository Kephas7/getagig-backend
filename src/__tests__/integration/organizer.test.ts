import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { OrganizerModel } from "../../models/organizer.model";

describe("Organizer Integration Tests", () => {
  const organizerUser = {
    username: "organizer_test",
    email: "organizer_test@example.com",
    password: "Test@1234",
    confirmPassword: "Test@1234",
    role: "organizer",
  };

  const musicianUser = {
    username: "musician_test_org",
    email: "musician_test_org@example.com",
    password: "Test@1234",
    confirmPassword: "Test@1234",
    role: "musician",
  };

  let organizerToken: string;
  let musicianToken: string;

  beforeAll(async () => {
    await UserModel.deleteMany({
      email: { $in: [organizerUser.email, musicianUser.email] },
    });
    await OrganizerModel.deleteMany({});

    // Register and login organizer
    await request(app).post("/api/auth/register").send(organizerUser);
    const organizerLogin = await request(app).post("/api/auth/login").send({
      email: organizerUser.email,
      password: organizerUser.password,
    });
    organizerToken = organizerLogin.body.data.token;

    // Register and login musician
    await request(app).post("/api/auth/register").send(musicianUser);
    const musicianLogin = await request(app).post("/api/auth/login").send({
      email: musicianUser.email,
      password: musicianUser.password,
    });
    musicianToken = musicianLogin.body.data.token;
  });

  afterAll(async () => {
    await UserModel.deleteMany({
      email: { $in: [organizerUser.email, musicianUser.email] },
    });
    await OrganizerModel.deleteMany({});
  });

  describe("POST /api/organizers/profile", () => {
    const profileData = {
      organizationName: "Test Events Inc",
      bio: "An events testing company",
      contactPerson: "Test Manager",
      phone: "9876543210",
      email: "events@example.com",
      location: "Event City, Event State, Event Country",
      organizationType: "Corporate",
      eventTypes: ["Conference", "Meeting"],
    };

    test("should create an organizer profile", async () => {
      const response = await request(app)
        .post("/api/organizers/profile")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send(profileData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty(
        "organizationName",
        profileData.organizationName,
      );
    });

    test("should not allow musician to create an organizer profile", async () => {
      const response = await request(app)
        .post("/api/organizers/profile")
        .set("Authorization", `Bearer ${musicianToken}`)
        .send(profileData);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        "Forbidden: This action requires one of the following roles: organizer",
      );
    });

    test("should not create profile if already exists", async () => {
      const response = await request(app)
        .post("/api/organizers/profile")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send(profileData);

      expect(response.status).toBe(409);
    });
  });

  describe("GET /api/organizers/profile", () => {
    test("should get own profile", async () => {
      const response = await request(app)
        .get("/api/organizers/profile")
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("organizationName");
    });
  });

  describe("PUT /api/organizers/profile", () => {
    test("should update own profile", async () => {
      const updateData = { organizationName: "Updated Events Inc" };
      const response = await request(app)
        .put("/api/organizers/profile")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty(
        "organizationName",
        updateData.organizationName,
      );
    });
  });
});
