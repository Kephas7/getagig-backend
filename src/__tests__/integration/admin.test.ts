import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { MusicianModel } from "../../models/musician.model";
import mongoose from "mongoose";

describe("Admin Integration Tests", () => {
    const adminUser = {
        username: "admin_test",
        email: "admin_test@example.com",
        password: "Test@1234",
        confirmPassword: "Test@1234",
        role: "admin",
    };

    const musicianUser = {
        username: "musician_test_admin",
        email: "musician_test_admin@example.com",
        password: "Test@1234",
        confirmPassword: "Test@1234",
        role: "musician",
    };

    let adminToken: string;
    let musicianToken: string;
    let musicianId: string;

    beforeAll(async () => {
        await UserModel.deleteMany({ email: { $in: [adminUser.email, musicianUser.email] } });

        // Register and login admin
        await request(app).post("/api/auth/register").send(adminUser);
        const adminLogin = await request(app).post("/api/auth/login").send({
            email: adminUser.email,
            password: adminUser.password,
        });
        adminToken = adminLogin.body.data.token;

        // Register and login musician
        await request(app).post("/api/auth/register").send(musicianUser);
        const musicianLogin = await request(app).post("/api/auth/login").send({
            email: musicianUser.email,
            password: musicianUser.password,
        });
        musicianToken = musicianLogin.body.data.token;
        musicianId = musicianLogin.body.data.user.id;

        await request(app)
            .post("/api/musicians/profile")
            .set("Authorization", `Bearer ${musicianToken}`)
            .send({
                stageName: "Admin Coverage Musician",
                bio: "Created for admin listing coverage",
                phone: "1234567890",
                location: "Test City, Test State, Test Country",
                genres: ["Rock"],
                instruments: ["Guitar"],
                experienceYears: 5,
                hourlyRate: 75,
            });
    });

    afterAll(async () => {
        await UserModel.deleteMany({ email: { $in: [adminUser.email, musicianUser.email] } });
        if (musicianId) {
            await MusicianModel.deleteMany({ userId: musicianId });
        }
    });

    describe("GET /api/admin/users", () => {
        test("should list all users for admin", async () => {
            const response = await request(app)
                .get("/api/admin/users")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.users)).toBe(true);
        });

        test("should deny access to non-admin", async () => {
            const response = await request(app)
                .get("/api/admin/users")
                .set("Authorization", `Bearer ${musicianToken}`);

            expect(response.status).toBe(403);
            expect(response.body.message).toBe("Forbidden: This action requires one of the following roles: admin");
        });

        test("should include pagination metadata", async () => {
            const response = await request(app)
                .get("/api/admin/users?page=1&limit=1")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty("total");
            expect(response.body.data).toHaveProperty("page", 1);
            expect(response.body.data).toHaveProperty("totalPages");
            expect(Array.isArray(response.body.data.users)).toBe(true);
            expect(response.body.data.users.length).toBe(1);
        });

        test("should use musician profile picture when user profile picture is missing", async () => {
            const musicianProfilePicture = "/uploads/musicians/admin-profile.jpg";

            await UserModel.findByIdAndUpdate(musicianId, {
                $unset: { profilePicture: 1 },
            });
            await MusicianModel.findOneAndUpdate(
                { userId: musicianId },
                { $set: { profilePicture: musicianProfilePicture } },
            );

            const response = await request(app)
                .get("/api/admin/users")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);

            const listedMusician = response.body.data.users.find(
                (user: any) => user.email === musicianUser.email,
            );
            expect(listedMusician).toBeDefined();
            expect(listedMusician.profilePicture).toBe(musicianProfilePicture);
        });

        test("should fallback to user profile picture when musician profile picture is missing", async () => {
            const userProfilePicture = "/uploads/users/admin-user-picture.jpg";

            await MusicianModel.findOneAndUpdate(
                { userId: musicianId },
                { $unset: { profilePicture: 1 } },
            );
            await UserModel.findByIdAndUpdate(musicianId, {
                $set: { profilePicture: userProfilePicture },
            });

            const response = await request(app)
                .get("/api/admin/users")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);

            const listedMusician = response.body.data.users.find(
                (user: any) => user.email === musicianUser.email,
            );
            expect(listedMusician).toBeDefined();
            expect(listedMusician.profilePicture).toBe(userProfilePicture);
        });
    });

    describe("GET /api/admin/users/:id", () => {
        test("should get a user by id as admin", async () => {
            const response = await request(app)
                .get(`/api/admin/users/${musicianId}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.email).toBe(musicianUser.email);
        });

        test("should return 404 for a non-existent user id", async () => {
            const unknownUserId = new mongoose.Types.ObjectId().toString();

            const response = await request(app)
                .get(`/api/admin/users/${unknownUserId}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("User not found");
        });

        test("should deny non-admin access to get user by id", async () => {
            const response = await request(app)
                .get(`/api/admin/users/${musicianId}`)
                .set("Authorization", `Bearer ${musicianToken}`);

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });

    describe("DELETE /api/admin/users/:id", () => {
        test("should delete a user as admin", async () => {
            // Create a dummy user to delete
            const dummyUser = {
                username: "tobedeleted",
                email: "delete@example.com",
                password: "Test@1234",
                confirmPassword: "Test@1234",
                role: "musician",
            };
            const regResponse = await request(app).post("/api/auth/register").send(dummyUser);
            const userId = regResponse.body.data.id;

            const response = await request(app)
                .delete(`/api/admin/users/${userId}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
        });
    });
});
