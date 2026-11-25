import request from "supertest";
import app from "../src/app";
import { passwordResetService } from "../src/services/passwordReset.service";

jest.mock("../src/services/passwordReset.service", () => ({
  passwordResetService: {
    requestReset: jest.fn(),
    resetPassword: jest.fn(),
  },
}));

const service = jest.mocked(passwordResetService);

describe("Password reset API", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "test";
    service.requestReset.mockReset();
    service.resetPassword.mockReset();
  });

  it.each([
    "taylor@gmail.com",
    "taylor@outlook.com",
    "taylor@microsoft.com",
    "taylor@yopmail.com",
  ])("accepts a reset request for %s without revealing account existence", async (email) => {
    service.requestReset.mockResolvedValue();

    const response = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email });

    expect(response.status).toBe(202);
    expect(response.body).toEqual({
      success: true,
      message: "If an account exists for this email, reset instructions have been sent.",
      data: null,
    });
    expect(service.requestReset).toHaveBeenCalledWith(email.toLowerCase());
  });

  it("validates reset request email format and maximum length", async () => {
    const response = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: `${"a".repeat(250)}@example.com` });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "email" })])
    );
    expect(service.requestReset).not.toHaveBeenCalled();
  });

  it("validates reset token, password length, and password confirmation", async () => {
    const response = await request(app)
      .post("/api/auth/reset-password")
      .send({
        token: "short",
        password: "short",
        confirmPassword: "different",
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "token" }),
        expect.objectContaining({ field: "password" }),
        expect.objectContaining({ field: "confirmPassword" }),
      ])
    );
    expect(service.resetPassword).not.toHaveBeenCalled();
  });

  it("resets the password for a valid reset request", async () => {
    service.resetPassword.mockResolvedValue();
    const token = "A".repeat(43);

    const response = await request(app)
      .post("/api/auth/reset-password")
      .send({
        token,
        password: "A-strong-password1",
        confirmPassword: "A-strong-password1",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(service.resetPassword).toHaveBeenCalledWith(token, "A-strong-password1");
  });
});
