import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { User } from "../src/models/User";
import { passwordResetService } from "../src/services/passwordReset.service";
import { AppError } from "../src/utils/AppError";

jest.mock("../src/models/User", () => ({
  User: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn(),
  },
}));

jest.mock("nodemailer", () => ({
  createTransport: jest.fn(),
}));

const findOneMock = User.findOne as jest.Mock;
const findOneAndUpdateMock = User.findOneAndUpdate as jest.Mock;
const updateOneMock = User.updateOne as jest.Mock;
const createTransportMock = nodemailer.createTransport as jest.Mock;

describe("Password reset service", () => {
  const mailer = { sendMail: jest.fn() };
  const user = { _id: "user-id", email: "taylor@example.com" };

  beforeEach(() => {
    process.env.CLIENT_URL = "http://localhost:5173";
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_SECURE = "false";
    process.env.SMTP_FROM = "Socially <no-reply@example.com>";
    process.env.SMTP_USER = "";
    process.env.SMTP_PASSWORD = "";
    findOneMock.mockReset();
    findOneAndUpdateMock.mockReset();
    updateOneMock.mockReset().mockResolvedValue({ modifiedCount: 1 });
    mailer.sendMail.mockReset().mockResolvedValue({});
    createTransportMock.mockReset().mockReturnValue(mailer);
  });

  it("sends a reset link while storing only a short-lived token hash", async () => {
    findOneMock.mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });

    await passwordResetService.requestReset(user.email);

    const update = updateOneMock.mock.calls[0][1] as {
      $set: { passwordResetTokenHash: string; passwordResetExpiresAt: Date };
    };
    const message = mailer.sendMail.mock.calls[0][0] as {
      text: string;
      to: string;
    };
    const resetUrl = new URL(message.text.match(/https?:\/\/\S+/)?.[0] ?? "");
    const token = resetUrl.searchParams.get("token");

    expect(message.to).toBe(user.email);
    expect(resetUrl.pathname).toBe("/reset-password");
    expect(token).toHaveLength(43);
    expect(update.$set.passwordResetTokenHash).not.toBe(token);
    expect(update.$set.passwordResetExpiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(update.$set.passwordResetExpiresAt.getTime()).toBeLessThanOrEqual(
      Date.now() + 15 * 60 * 1000
    );
  });

  it("reports a missing SMTP host separately from the port that defaults to 587", async () => {
    process.env.SMTP_HOST = "";

    await expect(passwordResetService.requestReset(user.email)).rejects.toMatchObject({
      statusCode: 503,
      message: "SMTP_HOST is missing. Configure your outgoing mail provider in backend/.env.development.",
    });

    expect(findOneMock).not.toHaveBeenCalled();
  });

  it("requires both SMTP authentication values when either is provided", async () => {
    process.env.SMTP_USER = "sender@provider.test";

    await expect(passwordResetService.requestReset(user.email)).rejects.toMatchObject({
      statusCode: 503,
      message: "Set both SMTP_USER and SMTP_PASSWORD for email authentication.",
    });

    expect(findOneMock).not.toHaveBeenCalled();
  });

  it("supports Gmail SMTP with authentication and defaults the sender to that account", async () => {
    process.env.SMTP_HOST = "smtp.gmail.com";
    process.env.SMTP_USER = "sender@gmail.com";
    process.env.SMTP_PASSWORD = "test-app-password";
    process.env.SMTP_FROM = "";
    findOneMock.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await passwordResetService.requestReset(user.email);

    expect(createTransportMock).toHaveBeenCalledWith({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: "sender@gmail.com", pass: "test-app-password" },
    });
  });

  it("supports Outlook/Microsoft 365 SMTP settings", async () => {
    process.env.SMTP_HOST = "smtp.office365.com";
    process.env.SMTP_USER = "sender@outlook.com";
    process.env.SMTP_PASSWORD = "test-password";
    process.env.SMTP_FROM = "sender@outlook.com";
    findOneMock.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await passwordResetService.requestReset(user.email);

    expect(createTransportMock).toHaveBeenCalledWith({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      auth: { user: "sender@outlook.com", pass: "test-password" },
    });
  });

  it("returns normally for unknown emails without sending mail", async () => {
    findOneMock.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await expect(passwordResetService.requestReset(user.email)).resolves.toBeUndefined();

    expect(mailer.sendMail).not.toHaveBeenCalled();
    expect(updateOneMock).not.toHaveBeenCalled();
  });

  it("clears the reset token and reports an explicit error when delivery fails", async () => {
    findOneMock.mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });
    mailer.sendMail.mockRejectedValue(new Error("provider unavailable"));
    const errorLog = jest.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(passwordResetService.requestReset(user.email)).rejects.toMatchObject({
      statusCode: 503,
      message: "Unable to send password reset email. Please try again later.",
    });

    expect(updateOneMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ _id: user._id, passwordResetTokenHash: expect.any(String) }),
      { $unset: { passwordResetTokenHash: "", passwordResetExpiresAt: "" } }
    );
    errorLog.mockRestore();
  });

  it("atomically updates the password and consumes the reset token", async () => {
    findOneAndUpdateMock.mockResolvedValue({ _id: "user-id" });

    await passwordResetService.resetPassword("A".repeat(43), "A-strong-password1");

    const [query, update] = findOneAndUpdateMock.mock.calls[0];
    expect(query).toMatchObject({
      passwordResetTokenHash: expect.any(String),
      passwordResetExpiresAt: { $gt: expect.any(Date) },
    });
    expect(await bcrypt.compare("A-strong-password1", update.$set.password)).toBe(true);
    expect(update.$unset).toEqual({
      passwordResetTokenHash: "",
      passwordResetExpiresAt: "",
    });
  });

  it("rejects unknown, expired, or previously used reset tokens", async () => {
    findOneAndUpdateMock.mockResolvedValue(null);

    await expect(
      passwordResetService.resetPassword("A".repeat(43), "A-strong-password1")
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid or expired password reset link.",
    } satisfies Partial<AppError>);
  });
});
