import bcrypt from "bcryptjs";
import { User } from "../src/models/User";
import { emailService } from "../src/services/email.service";
import { passwordResetService } from "../src/services/passwordReset.service";
import { AppError } from "../src/utils/AppError";

jest.mock("../src/models/User", () => ({
  User: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn(),
  },
}));

jest.mock("../src/services/email.service", () => ({
  emailService: {
    verifyEmailConnection: jest.fn(),
    sendEmail: jest.fn(),
  },
  getEmailServiceErrorCode: (error: unknown) =>
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : "EMAIL_UNKNOWN_ERROR",
}));

const findOneMock = User.findOne as jest.Mock;
const findOneAndUpdateMock = User.findOneAndUpdate as jest.Mock;
const updateOneMock = User.updateOne as jest.Mock;
const verifyEmailMock = emailService.verifyEmailConnection as jest.Mock;
const sendEmailMock = emailService.sendEmail as jest.Mock;

describe("Password reset service", () => {
  const user = { _id: "user-id", email: "taylor@example.com" };

  beforeEach(() => {
    process.env.CLIENT_URL = "http://localhost:5173";
    findOneMock.mockReset();
    findOneAndUpdateMock.mockReset();
    updateOneMock.mockReset().mockResolvedValue({ modifiedCount: 1 });
    verifyEmailMock.mockReset().mockResolvedValue(undefined);
    sendEmailMock.mockReset().mockResolvedValue(undefined);
  });

  it("sends a reset link while storing only a short-lived token hash", async () => {
    findOneMock.mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });

    await passwordResetService.requestReset(user.email);

    const update = updateOneMock.mock.calls[0][1] as {
      $set: { passwordResetTokenHash: string; passwordResetExpiresAt: Date };
    };
    const message = sendEmailMock.mock.calls[0][0] as {
      text: string;
      html: string;
      to: string;
    };
    const resetUrl = new URL(message.text.match(/https?:\/\/\S+/)?.[0] ?? "");
    const token = resetUrl.searchParams.get("token");

    expect(message.to).toBe(user.email);
    expect(resetUrl.origin).toBe("http://localhost:5173");
    expect(resetUrl.pathname).toBe("/reset-password");
    expect(message.html).toContain(`href="${resetUrl.toString()}"`);
    expect(message.html).toContain("15 minutes");
    expect(token).toHaveLength(43);
    expect(update.$set.passwordResetTokenHash).not.toBe(token);
    expect(update.$set.passwordResetExpiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(update.$set.passwordResetExpiresAt.getTime()).toBeLessThanOrEqual(
      Date.now() + 15 * 60 * 1000
    );
    expect(verifyEmailMock).toHaveBeenCalledTimes(1);
  });

  it.each(["jaypandya@yupmail.com", "jay123@gmail.com"])(
    "sends to registered address %s and uses the configured production frontend URL",
    async (email) => {
      process.env.CLIENT_URL = "https://socially-demo.vercel.app";
      findOneMock.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: user._id, email }),
      });

      await passwordResetService.requestReset(email);

      const message = sendEmailMock.mock.calls[0][0] as {
        to: string;
        text: string;
      };
      const resetUrl = new URL(message.text.match(/https?:\/\/\S+/)?.[0] ?? "");

      expect(message.to).toBe(email);
      expect(resetUrl.origin).toBe("https://socially-demo.vercel.app");
      expect(resetUrl.pathname).toBe("/reset-password");
    }
  );

  it("returns a safe service error before checking accounts when SMTP is unavailable", async () => {
    verifyEmailMock.mockRejectedValue(
      Object.assign(new Error("Missing SMTP_HOST secret details"), {
        code: "SMTP_HOST_MISSING",
      })
    );
    const errorLog = jest.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(passwordResetService.requestReset(user.email)).rejects.toMatchObject({
      statusCode: 503,
      message: "Password reset email is temporarily unavailable. Please try again later.",
    });

    expect(findOneMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(errorLog).toHaveBeenCalledWith(
      "Password reset email service unavailable:",
      "SMTP_HOST_MISSING"
    );
    errorLog.mockRestore();
  });

  it("clears the reset token and logs send failures without exposing account existence", async () => {
    findOneMock.mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });
    sendEmailMock.mockRejectedValue(
      Object.assign(new Error("Missing SMTP_HOST secret details"), {
        code: "SMTP_HOST_MISSING",
      })
    );
    const errorLog = jest.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(passwordResetService.requestReset(user.email)).resolves.toBeUndefined();

    expect(updateOneMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ _id: user._id, passwordResetTokenHash: expect.any(String) }),
      { $unset: { passwordResetTokenHash: "", passwordResetExpiresAt: "" } }
    );
    expect(errorLog).toHaveBeenCalledWith(
      "Password reset email delivery failed:",
      "SMTP_HOST_MISSING"
    );
    errorLog.mockRestore();
  });

  it("returns normally for unknown emails without sending mail", async () => {
    findOneMock.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await expect(passwordResetService.requestReset(user.email)).resolves.toBeUndefined();

    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(updateOneMock).not.toHaveBeenCalled();
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
