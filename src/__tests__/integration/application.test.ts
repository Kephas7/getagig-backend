import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { GigModel } from "../../models/gig.model";
import { MusicianModel } from "../../models/musician.model";
import { OrganizerModel } from "../../models/organizer.model";
import { ApplicationModel } from "../../models/application.model";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config";

describe("Application Integration Tests", () => {
  let musicianToken: string;
  let organizerToken: string;
  let gigId: string;
  let applicationId: string;

  beforeAll(async () => {
    await ApplicationModel.deleteMany({});
    await GigModel.deleteMany({});
    await MusicianModel.deleteMany({});
    await OrganizerModel.deleteMany({});
    await UserModel.deleteMany({});

    // Create Musician
    const musicianUser = await UserModel.create({
      username: "musician",
      email: "musician@test.com",
      password: "password123",
      role: "musician",
    });
    const musician = await MusicianModel.create({
      userId: musicianUser._id,
      stageName: "Test Artist",
      phone: "1234567890",
      location: "NYC, NY, USA",
      genres: ["Jazz"],
      instruments: ["Piano"],
      experienceYears: 5,
    });
    musicianToken = jwt.sign(
      { id: musicianUser._id, role: "musician" },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    // Create Organizer
    const organizerUser = await UserModel.create({
      username: "organizer",
      email: "organizer@test.com",
      password: "password123",
      role: "organizer",
    });
    const organizer = await OrganizerModel.create({
      userId: organizerUser._id,
      organizationName: "Test Events",
      contactPerson: "Test Contact",
      phone: "0987654321",
      email: "organizer@test.com",
      location: "NYC, NY, USA",
      organizationType: "Event Company",
      eventTypes: ["Wedding"],
    });
    organizerToken = jwt.sign(
      { id: organizerUser._id, role: "organizer" },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    // Create Gig
    const gig = await GigModel.create({
      title: "Test Gig",
      description: "A test gig",
      location: "NYC, NY, USA",
      genres: ["Jazz"],
      instruments: ["Piano"],
      payRate: 100,
      eventType: "Wedding",
      eventDate: new Date(Date.now() + 172800000),
      deadline: new Date(Date.now() + 86400000),
      organizerId: organizer._id,
      status: "open",
    });
    gigId = (gig._id as any).toString();

    // Verification
    const checkMusician = await MusicianModel.findOne({
      userId: musicianUser._id,
    });
    if (!checkMusician)
      throw new Error("Musician creation failed in test setup");
    const checkGig = await GigModel.findById(gigId);
    if (!checkGig) throw new Error("Gig creation failed in test setup");
  });

  it("should allow a musician to apply for a gig", async () => {
    const res = await request(app)
      .post("/api/applications")
      .set("Authorization", `Bearer ${musicianToken}`)
      .send({
        gigId,
        coverLetter: "I am a great pianist!",
      });

    if (res.status !== 201) console.log("Apply error:", res.body);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.gigId).toBe(gigId);
    applicationId = res.body.data.id;
  });

  it("should not allow duplicate applications", async () => {
    const res = await request(app)
      .post("/api/applications")
      .set("Authorization", `Bearer ${musicianToken}`)
      .send({ gigId });

    expect(res.status).toBe(400);
  });

  it("should allow organizer to view applications for their gig", async () => {
    const res = await request(app)
      .get(`/api/applications/gig/${gigId}`)
      .set("Authorization", `Bearer ${organizerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].musician.stageName).toBe("Test Artist");
  });

  it("should allow organizer to accept an application", async () => {
    const res = await request(app)
      .put(`/api/applications/${applicationId}/status`)
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ status: "accepted" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("accepted");
  });
});
