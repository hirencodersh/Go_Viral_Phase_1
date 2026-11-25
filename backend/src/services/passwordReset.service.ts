import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_LIFETIME_MS = 15 * 60 * 1000;

const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

const createMailTransport = () => {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM?.trim() || user;
  const port = Number(process.env.SMTP_PORT || 587);

  if (!host) {
    throw new AppError(
      503,
      "SMTP_HOST is missing. Configure your outgoing mail provider in backend/.env.development."
    );
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new AppError(503, "SMTP_PORT must be a number between 1 and 65535.");
  }
  if (Boolean(user) !== Boolean(password)) {
    throw new AppError(503, "Set both SMTP_USER and SMTP_PASSWORD for email authentication.");
  }
  if (!from) {
    throw new AppError(503, "Set SMTP_FROM or SMTP_USER as the password reset sender address.");
  }

  return {
    from,
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === "true" || port === 465,
      ...(user && password ? { auth: { user, pass: password } } : {}),
    }),
  };
};

export const passwordResetService = {
  async requestReset(email: string): Promise<void> {
    const mail = createMailTransport();
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
      await mail.transporter.sendMail({
        from: mail.from,
        to: user.email,
        subject: "Reset your Socially password",
        text: `Use this link to reset your password: ${resetUrl.toString()}\n\nThis link expires in 15 minutes. If you did not request a reset, you can ignore this email.`,
        html: `<p>Use the link below to reset your Socially password. It expires in 15 minutes.</p><p><a href="${resetUrl.toString()}">Reset your password</a></p><p>If you did not request a reset, you can ignore this email.</p>`,
      });
    } catch (error) {
      await User.updateOne(
        { _id: user._id, passwordResetTokenHash: tokenHash },
        {
          $unset: {
            passwordResetTokenHash: "",
            passwordResetExpiresAt: "",
          },
        }
      );
      console.error(
        "Password reset email delivery failed:",
        error instanceof Error ? error.name : "Unknown error"
      );
      throw new AppError(503, "Unable to send password reset email. Please try again later.");
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
