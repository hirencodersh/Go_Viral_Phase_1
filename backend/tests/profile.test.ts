import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../src/app";
import { profileService } from "../src/services/profile.service";

jest.mock("../src/services/profile.service", () => ({
  profileService: {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    updateRoles: jest.fn(),
    updatePhoto: jest.fn(),
  },
}));

const service = jest.mocked(profileService);
const secret = "test-secret-with-more-than-thirty-two-characters";
const today = new Date();
const underageDob = `${today.getUTCFullYear() - 17}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;
const profile = {
  _id: "507f1f77bcf86cd799439011",
  username: "taylor.sample",
  email: "taylor@example.com",
  profilePhoto: "",
  bio: "Hello",
  roles: ["fan"] as ("fan" | "creator")[],
};

describe("User profile and role API", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = secret;
    jest.clearAllMocks();
  });

  const cookie = () =>
    `social_access_token=${jwt.sign({ sub: profile._id, dob: "1990-05-12" }, secret, { expiresIn: "1h" })}`;

  it("rejects unauthenticated profile access", async () => {
    const response = await request(app).get("/api/users/profile");
    expect(response.status).toBe(401);
  });

  it("blocks underage authenticated users from profile endpoints", async () => {
    const token = jwt.sign({ sub: profile._id, dob: underageDob }, secret, { expiresIn: "1h" });
    const response = await request(app)
      .get("/api/users/profile")
      .set("Cookie", `social_access_token=${token}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("You must be at least 18 years old to use Socially.");
    expect(service.getProfile).not.toHaveBeenCalled();
  });

  it("returns the logged-in user's profile", async () => {
    service.getProfile.mockResolvedValue(profile);
    const response = await request(app).get("/api/users/profile").set("Cookie", cookie());
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(profile);
  });

  it("updates username and bio", async () => {
    const updated = { ...profile, username: "taylor.updated", bio: "Updated bio" };
    service.updateProfile.mockResolvedValue(updated);
    const response = await request(app)
      .put("/api/users/profile")
      .set("Cookie", cookie())
      .send({ username: "Taylor.Updated", bio: "Updated bio" });
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(updated);
  });

  it("allows fan and creator together", async () => {
    const updated = { ...profile, roles: ["fan", "creator"] as ("fan" | "creator")[] };
    service.updateRoles.mockResolvedValue(updated);
    const response = await request(app)
      .patch("/api/users/roles")
      .set("Cookie", cookie())
      .send({ roles: ["fan", "creator"] });
    expect(response.status).toBe(200);
    expect(service.updateRoles).toHaveBeenCalledWith(profile._id, ["fan", "creator"]);
  });

  it("rejects empty roles", async () => {
    const response = await request(app)
      .patch("/api/users/roles")
      .set("Cookie", cookie())
      .send({ roles: [] });
    expect(response.status).toBe(400);
    expect(service.updateRoles).not.toHaveBeenCalled();
  });

  it("rejects invalid and duplicate roles", async () => {
    const invalid = await request(app)
      .patch("/api/users/roles")
      .set("Cookie", cookie())
      .send({ roles: ["admin"] });
    const duplicate = await request(app)
      .patch("/api/users/roles")
      .set("Cookie", cookie())
      .send({ roles: ["fan", "fan"] });
    expect(invalid.status).toBe(400);
    expect(duplicate.status).toBe(400);
  });
});
