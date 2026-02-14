import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";

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
    });

    afterAll(async () => {
        await UserModel.deleteMany({ email: { $in: [adminUser.email, musicianUser.email] } });
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
