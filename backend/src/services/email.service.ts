import { createHash } from "crypto";
import nodemailer from "nodemailer";

export type EmailServiceErrorCode =
  | "SMTP_HOST_MISSING"
  | "SMTP_USER_MISSING"
  | "SMTP_PASSWORD_MISSING"
  | "SMTP_FROM_MISSING"
  | "SMTP_PORT_INVALID"
  | "SMTP_SECURE_INVALID"
  | "SMTP_TLS_MODE_INVALID"
  | "SMTP_VERIFY_FAILED"
  | "SMTP_SEND_FAILED"
  | "EMAIL_UNKNOWN_ERROR";

export class EmailServiceError extends Error {
  constructor(
    public readonly code: EmailServiceErrorCode,
    message: string
  ) {
    super(message);
    this.name = "EmailServiceError";
  }
}

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

type MailTransporter = ReturnType<typeof nodemailer.createTransport>;

let cachedTransporter: MailTransporter | undefined;
let cachedSettingsHash: string | undefined;
let verifiedSettingsHash: string | undefined;
let verifiedAt = 0;
const VERIFICATION_CACHE_MS = 60 * 1000;

const getSmtpSettings = (): SmtpSettings => {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const host = resendApiKey
    ? "smtp.resend.com"
    : process.env.SMTP_HOST?.trim();
  if (!host) {
    throw new EmailServiceError("SMTP_HOST_MISSING", "SMTP_HOST is missing.");
  }

  const user = resendApiKey ? "resend" : process.env.SMTP_USER?.trim();
  if (!user) {
    throw new EmailServiceError("SMTP_USER_MISSING", "SMTP_USER is missing.");
  }

  const password =
    resendApiKey ||
    process.env.SMTP_PASS ||
    process.env.SMTP_PASSWORD ||
    "";
  if (!password.trim()) {
    throw new EmailServiceError(
      "SMTP_PASSWORD_MISSING",
      "SMTP_PASS is missing."
    );
  }

  const from = process.env.SMTP_FROM?.trim();
  if (resendApiKey && !from) {
    throw new EmailServiceError(
      "SMTP_FROM_MISSING",
      "SMTP_FROM must be a sender address verified with Resend."
    );
  }

  const rawPort = process.env.SMTP_PORT?.trim();
  const port = rawPort ? Number(rawPort) : resendApiKey ? 465 : 587;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new EmailServiceError(
      "SMTP_PORT_INVALID",
      "SMTP_PORT must be a valid port number."
    );
  }

  const secureValue = process.env.SMTP_SECURE?.trim().toLowerCase();
  if (secureValue && secureValue !== "true" && secureValue !== "false") {
    throw new EmailServiceError(
      "SMTP_SECURE_INVALID",
      "SMTP_SECURE must be true or false."
    );
  }

  const secure = secureValue ? secureValue === "true" : port === 465;
  if ((port === 465 && !secure) || (port === 587 && secure)) {
    throw new EmailServiceError(
      "SMTP_TLS_MODE_INVALID",
      "Use secure TLS for port 465 and STARTTLS for port 587."
    );
  }

  return {
    host,
    port,
    secure,
    user,
    password,
    from: from || user,
  };
};

const getTransport = (): {
  from: string;
  settingsHash: string;
  transporter: MailTransporter;
} => {
  const settings = getSmtpSettings();
  const settingsHash = createHash("sha256")
    .update(
      [
        settings.host,
        settings.port,
        settings.secure,
        settings.user,
        settings.password,
        settings.from,
      ].join("\0")
    )
    .digest("hex");

  if (!cachedTransporter || cachedSettingsHash !== settingsHash) {
    cachedTransporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      requireTLS: settings.port === 587,
      auth: { user: settings.user, pass: settings.password },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
    cachedSettingsHash = settingsHash;
  }

  return {
    from: settings.from,
    settingsHash,
    transporter: cachedTransporter,
  };
};

const getSafeTransportErrorCode = (error: unknown): string => {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return "UNKNOWN";
  }
  const code = error.code;
  return typeof code === "string" && /^[A-Z0-9_]{1,48}$/.test(code)
    ? code
    : "UNKNOWN";
};

export const getEmailServiceErrorCode = (
  error: unknown
): EmailServiceErrorCode =>
  error instanceof EmailServiceError ? error.code : "EMAIL_UNKNOWN_ERROR";

export const emailService = {
  async verifyEmailConnection(): Promise<void> {
    const { settingsHash, transporter } = getTransport();
    if (
      verifiedSettingsHash === settingsHash &&
      Date.now() - verifiedAt < VERIFICATION_CACHE_MS
    ) {
      return;
    }

    try {
      await transporter.verify();
      verifiedSettingsHash = settingsHash;
      verifiedAt = Date.now();
    } catch (error) {
      verifiedSettingsHash = undefined;
      verifiedAt = 0;
      console.error(
        `SMTP connection verification failed (${getSafeTransportErrorCode(error)}).`
      );
      throw new EmailServiceError(
        "SMTP_VERIFY_FAILED",
        "Unable to verify the outgoing email connection."
      );
    }
  },

  async sendEmail(message: EmailMessage): Promise<void> {
    const { from, transporter } = getTransport();
    try {
      await transporter.sendMail({ ...message, from });
    } catch (error) {
      console.error(
        `SMTP email delivery failed (${getSafeTransportErrorCode(error)}).`
      );
      throw new EmailServiceError(
        "SMTP_SEND_FAILED",
        "Unable to send the email."
      );
    }
  },
};
