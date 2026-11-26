import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import {
  emailService,
  getEmailServiceErrorCode,
} from "./email.service";

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_LIFETIME_MS = 15 * 60 * 1000;
const RESET_EMAIL_ERROR =
  "Password reset email is temporarily unavailable. Please try again later.";

const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

const buildResetEmailHtml = (resetUrl: string): string => `
<!doctype html>
<html lang="en">
  <body style="margin:0;padding:32px 16px;background:#f3f6f4;font-family:Arial,sans-serif;color:#1b3928">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border:1px solid #dfe8e1;border-radius:16px">
            <tr>
              <td style="padding:32px">
                <div style="font-size:20px;font-weight:700;color:#1b3928">socially</div>
                <h1 style="margin:28px 0 12px;font-size:24px">Reset your password</h1>
                <p style="margin:0 0 24px;color:#59685e;line-height:1.6">We received a request to reset the password for your Socially account. Use the button below to choose a new password.</p>
                <p style="margin:0 0 24px">
                  <a href="${resetUrl}" style="display:inline-block;padding:14px 22px;background:#4add82;border-radius:9px;color:#143520;font-weight:700;text-decoration:none">Reset password</a>
                </p>
                <p style="margin:0 0 18px;color:#59685e;line-height:1.6">This link expires in <strong>15 minutes</strong> and can only be used once.</p>
                <p style="margin:0;color:#7a877e;font-size:13px;line-height:1.6">If you did not request a password reset, you can safely ignore this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

export const passwordResetService = {
  async requestReset(email: string): Promise<void> {
    try {
      await emailService.verifyEmailConnection();
    } catch (error) {
      console.error(
        "Password reset email service unavailable:",
        getEmailServiceErrorCode(error)
      );
      throw new AppError(503, RESET_EMAIL_ERROR);
    }

    const user = await User.findOne({ email }).select("_id email");
    if (!user) {
      return;
    }

    const token = randomBytes(32).toString("base64url");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_LIFETIME_MS);

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: expiresAt,
        },
      }
    );

    const resetUrl = new URL(
      "/reset-password",
      process.env.CLIENT_URL || "http://localhost:5173"
    );
    resetUrl.searchParams.set("token", token);

    try {
      await emailService.sendEmail({
        to: user.email,
        subject: "Reset your Socially password",
        text: `Use this link to reset your password: ${resetUrl.toString()}\n\nThis link expires in 15 minutes. If you did not request a reset, you can ignore this email.`,
        html: buildResetEmailHtml(resetUrl.toString()),
      });
    } catch (error) {
      try {
        await User.updateOne(
          { _id: user._id, passwordResetTokenHash: tokenHash },
          {
            $unset: {
              passwordResetTokenHash: "",
              passwordResetExpiresAt: "",
            },
          }
        );
      } catch (cleanupError) {
        console.error(
          "Failed to clear password reset token after email failure:",
          getEmailServiceErrorCode(cleanupError)
        );
      }
      console.error(
        "Password reset email delivery failed:",
        getEmailServiceErrorCode(error)
      );
    }
  },

  async resetPassword(token: string, password: string): Promise<void> {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await User.findOneAndUpdate(
      {
        passwordResetTokenHash: hashToken(token),
        passwordResetExpiresAt: { $gt: new Date() },
      },
      {
        $set: { password: passwordHash },
        $unset: {
          passwordResetTokenHash: "",
          passwordResetExpiresAt: "",
        },
      },
      { new: false }
    );
    if (!user) {
      throw new AppError(400, "Invalid or expired password reset link.");
    }
  },
};
