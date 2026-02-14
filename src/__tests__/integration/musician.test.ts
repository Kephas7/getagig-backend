import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { MusicianModel } from "../../models/musician.model";

describe("Musician Integration Tests", () => {
    const musicianUser = {
        username: "musicianuser",
        email: "musician@example.com",
        password: "Test@1234",
        confirmPassword: "Test@1234",
        role: "musician",
    };

    const organizerUser = {
        username: "organizeruser",
        email: "organizer@example.com",
        password: "Test@1234",
        confirmPassword: "Test@1234",
        role: "organizer",
    };

    let musicianToken: string;
    let organizerToken: string;
    let musicianId: string;

    beforeAll(async () => {
        await UserModel.deleteMany({ email: { $in: [musicianUser.email, organizerUser.email] } });
        await MusicianModel.deleteMany({});

        // Register and login musician
        await request(app).post("/api/auth/register").send(musicianUser);
        const musicianLogin = await request(app).post("/api/auth/login").send({
            email: musicianUser.email,
            password: musicianUser.password,
        });
        musicianToken = musicianLogin.body.data.token;
        musicianId = musicianLogin.body.data.user.id;

        // Register and login organizer
        await request(app).post("/api/auth/register").send(organizerUser);
        const organizerLogin = await request(app).post("/api/auth/login").send({
            email: organizerUser.email,
            password: organizerUser.password,
        });
        organizerToken = organizerLogin.body.data.token;
    });

    afterAll(async () => {
        await UserModel.deleteMany({ email: { $in: [musicianUser.email, organizerUser.email] } });
        await MusicianModel.deleteMany({});
    });

    describe("POST /api/musicians/profile", () => {
        const profileData = {
            stageName: "The Test Rocker",
            bio: "A test bio for the musician",
            phone: "1234567890",
            location: {
                city: "Test City",
                state: "Test State",
                country: "Test Country",
            },
            genres: ["Rock", "Metal"],
            instruments: ["Guitar", "Vocals"],
            experienceYears: 5,
            hourlyRate: 50,
        };

        test("should create a musician profile", async () => {
            const response = await request(app)
                .post("/api/musicians/profile")
                .set("Authorization", `Bearer ${musicianToken}`)
                .send(profileData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty("stageName", profileData.stageName);
        });

        test("should not create profile if already exists", async () => {
            const response = await request(app)
                .post("/api/musicians/profile")
                .set("Authorization", `Bearer ${musicianToken}`)
                .send(profileData);

            expect(response.status).toBe(409);
        });

        test("should not allow organizer to create a musician profile", async () => {
            const response = await request(app)
                .post("/api/musicians/profile")
                .set("Authorization", `Bearer ${organizerToken}`)
                .send(profileData);

            expect(response.status).toBe(403);
            expect(response.body.message).toBe("Forbidden: This action requires one of the following roles: musician");
        });
    });

    describe("GET /api/musicians/profile", () => {
        test("should get own profile", async () => {
            const response = await request(app)
                .get("/api/musicians/profile")
                .set("Authorization", `Bearer ${musicianToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty("stageName");
        });
    });

    describe("PUT /api/musicians/profile", () => {
        test("should update own profile", async () => {
            const updateData = { stageName: "Updated Stage Name" };
            const response = await request(app)
                .put("/api/musicians/profile")
                .set("Authorization", `Bearer ${musicianToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty("stageName", updateData.stageName);
        });
    });

    describe("GET /api/musicians/profile/:id", () => {
        test("should get profile by ID", async () => {
            const ownProfileResponse = await request(app)
                .get("/api/musicians/profile")
                .set("Authorization", `Bearer ${musicianToken}`);

            const profileId = ownProfileResponse.body.data.id;

            const response = await request(app)
                .get(`/api/musicians/profile/${profileId}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty("stageName");
        });
    });
});
