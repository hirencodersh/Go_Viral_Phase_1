import jwt from "jsonwebtoken";
import request from "supertest";
import { authService } from "../src/services/auth.service";
import app from "../src/app";
import { AppError } from "../src/utils/AppError";

jest.mock("../src/services/auth.service", () => ({
  authService: {
    register: jest.fn(),
    login: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}));

const service = jest.mocked(authService);
const testSecret = "test-secret-with-more-than-thirty-two-characters";
const user = {
  id: "507f1f77bcf86cd799439011",
  fullName: "Taylor Sample",
  username: "taylor.sample",
  email: "taylor@example.com",
};

describe("Authentication API", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "test";
    process.env.PORT = "5000";
    process.env.MONGO_URI = "mongodb://127.0.0.1:27017/social_test";
    process.env.CLIENT_URL = "http://localhost:5173";
    process.env.JWT_SECRET = testSecret;
    service.register.mockReset();
    service.login.mockReset();
    service.getCurrentUser.mockReset();
  });

  it("validates registration and reports mismatched passwords", async () => {
    const response = await request(app).post("/api/auth/register").send({
      fullName: "Taylor Sample",
      username: "taylor.sample",
      email: "taylor@example.com",
      password: "A-strong-password1",
      confirmPassword: "different-password",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "confirmPassword" }),
      ])
    );
    expect(service.register).not.toHaveBeenCalled();
  });

  it("registers a user and sets an HttpOnly authentication cookie", async () => {
    service.register.mockResolvedValue({
      token: "signed-token",
      rememberMe: false,
      user,
    });

    const response = await request(app).post("/api/auth/register").send({
      fullName: "Taylor Sample",
      username: "Taylor.Sample",
      email: "Taylor@Example.com",
      password: "A-strong-password1",
      confirmPassword: "A-strong-password1",
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      data: { user },
    });
    expect(response.headers["set-cookie"][0]).toContain("HttpOnly");
    expect(service.register).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "taylor.sample",
        email: "taylor@example.com",
      })
    );
  });

  it("returns a conflict response for duplicate registration", async () => {
    service.register.mockRejectedValue(
      new AppError(409, "Email address is already registered")
    );

    const response = await request(app).post("/api/auth/register").send({
      fullName: "Taylor Sample",
      username: "taylor.sample",
      email: "taylor@example.com",
      password: "A-strong-password1",
      confirmPassword: "A-strong-password1",
    });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Email address is already registered");
  });

  it("logs in and honors Remember Me with a persistent cookie", async () => {
    service.login.mockResolvedValue({
      token: "signed-token",
      rememberMe: true,
      user,
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "taylor@example.com",
      password: "A-strong-password1",
      rememberMe: true,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.user).toEqual(user);
    expect(response.headers["set-cookie"][0]).toContain("Max-Age=2592000");
    expect(service.login).toHaveBeenCalledWith(
      expect.objectContaining({ rememberMe: true })
    );
  });

  it("returns a generic unauthorized response for invalid credentials", async () => {
    service.login.mockRejectedValue(
      new AppError(401, "Invalid email or password")
    );

    const response = await request(app).post("/api/auth/login").send({
      email: "taylor@example.com",
      password: "wrong-password",
      rememberMe: false,
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid email or password");
  });

  it("rejects unauthenticated requests to /me", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("returns the current user for a valid cookie", async () => {
    const token = jwt.sign(
      { sub: user.id },
      testSecret,
      { expiresIn: "1h" }
    );
    service.getCurrentUser.mockResolvedValue(user);

    const response = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `social_access_token=${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.user).toEqual(user);
    expect(service.getCurrentUser).toHaveBeenCalledWith(user.id);
  });

  it("rejects expired authentication cookies", async () => {
    const token = jwt.sign({ sub: user.id }, testSecret, { expiresIn: -1 });

    const response = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `social_access_token=${token}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe(
      "Invalid or expired authentication token"
    );
    expect(service.getCurrentUser).not.toHaveBeenCalled();
  });

  it("logs out by clearing the authentication cookie", async () => {
    const response = await request(app).post("/api/auth/logout");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.headers["set-cookie"][0]).toMatch(/Expires=/);
  });
});
