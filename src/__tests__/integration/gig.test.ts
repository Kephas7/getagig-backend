import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { OrganizerModel } from "../../models/organizer.model";
import { GigModel } from "../../models/gig.model";
import mongoose from "mongoose";

describe("Gig Integration Tests", () => {
    let organizerToken: string;
    let musicianToken: string;
    let testGigId: string;
    let organizerId: string;

    const testOrganizerUser = {
        username: "testorganizer",
        email: "organizer@test.com",
        password: "Password123!",
        role: "organizer",
    };

    const testMusicianUser = {
        username: "testmusician",
        email: "musician@test.com",
        password: "Password123!",
        role: "musician",
    };

    beforeAll(async () => {
        // Clean up
        await UserModel.deleteMany({ email: { $in: [testOrganizerUser.email, testMusicianUser.email] } });
        await OrganizerModel.deleteMany({});
        await GigModel.deleteMany({});

        // Register and login organizer
        await request(app).post("/api/auth/register").send({ ...testOrganizerUser, confirmPassword: testOrganizerUser.password });
        const orgLogin = await request(app).post("/api/auth/login").send({ email: testOrganizerUser.email, password: testOrganizerUser.password });
        organizerToken = orgLogin.body.data.token;

        // Create organizer profile
        await request(app)
            .post("/api/organizers/profile")
            .set("Authorization", `Bearer ${organizerToken}`)
            .send({
                organizationName: "Test Org",
                contactPerson: "John Doe",
                phone: "1234567890",
                email: testOrganizerUser.email,
                location: { city: "New York", state: "NY", country: "USA" },
                organizationType: "Club",
                eventTypes: ["Concert"],
            });

        // Register and login musician
        await request(app).post("/api/auth/register").send({ ...testMusicianUser, confirmPassword: testMusicianUser.password });
        const musLogin = await request(app).post("/api/auth/login").send({ email: testMusicianUser.email, password: testMusicianUser.password });
        musicianToken = musLogin.body.data.token;
    });

    afterAll(async () => {
        await UserModel.deleteMany({ email: { $in: [testOrganizerUser.email, testMusicianUser.email] } });
        await OrganizerModel.deleteMany({});
        await GigModel.deleteMany({});
    });

    describe("POST /api/gigs", () => {
        test("should allow an organizer to post a gig", async () => {
            const gigData = {
                title: "Pianist Needed",
                description: "Looking for a jazz pianist for a weekend gig.",
                location: { city: "New York", state: "NY", country: "USA" },
                genres: ["Jazz"],
                instruments: ["Piano"],
                payRate: 200,
                eventType: "Concert",
                deadline: new Date(Date.now() + 86400000).toISOString(),
            };

            const response = await request(app)
                .post("/api/gigs")
                .set("Authorization", `Bearer ${organizerToken}`)
                .send(gigData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe(gigData.title);
            testGigId = response.body.data.id;
        });

        test("should not allow a musician to post a gig", async () => {
            const response = await request(app)
                .post("/api/gigs")
                .set("Authorization", `Bearer ${musicianToken}`)
                .send({ title: "Unauthorized Gig" });

            expect(response.status).toBe(403);
        });
    });

    describe("GET /api/gigs", () => {
        test("should return a list of gigs", async () => {
            const response = await request(app).get("/api/gigs");
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.data.gigs)).toBe(true);
            expect(response.body.data.gigs.length).toBeGreaterThan(0);
        });

        test("should filter gigs by city", async () => {
            const response = await request(app).get("/api/gigs?city=New York");
            expect(response.status).toBe(200);
            expect(response.body.data.gigs[0].location.city).toBe("New York");
        });
    });

    describe("GET /api/gigs/:id", () => {
        test("should return gig details", async () => {
            const response = await request(app).get(`/api/gigs/${testGigId}`);
            expect(response.status).toBe(200);
            expect(response.body.data.id).toBe(testGigId);
        });
    });

    describe("PUT /api/gigs/:id", () => {
        test("should allow the owner to update the gig", async () => {
            const response = await request(app)
                .put(`/api/gigs/${testGigId}`)
                .set("Authorization", `Bearer ${organizerToken}`)
                .send({ title: "Updated Title" });

            expect(response.status).toBe(200);
            expect(response.body.data.title).toBe("Updated Title");
        });
    });

    describe("DELETE /api/gigs/:id", () => {
        test("should allow the owner to delete the gig", async () => {
            const response = await request(app)
                .delete(`/api/gigs/${testGigId}`)
                .set("Authorization", `Bearer ${organizerToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Gig deleted successfully");
        });
    });
});
