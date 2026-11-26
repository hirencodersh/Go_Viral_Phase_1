import nodemailer from "nodemailer";
import {
  emailService,
} from "../src/services/email.service";

jest.mock("nodemailer", () => ({
  createTransport: jest.fn(),
}));

const createTransportMock = nodemailer.createTransport as jest.Mock;
const mailTransport = {
  verify: jest.fn(),
  sendMail: jest.fn(),
  close: jest.fn(),
};

let hostCounter = 0;

describe("Reusable email service", () => {
  beforeEach(() => {
    hostCounter += 1;
    process.env.SMTP_HOST = `smtp-${hostCounter}.example.test`;
    process.env.SMTP_PORT = "587";
    process.env.SMTP_SECURE = "false";
    process.env.SMTP_USER = "sender@example.test";
    process.env.SMTP_PASS = "test-app-password";
    process.env.SMTP_FROM = "Socially <sender@example.test>";
    delete process.env.SMTP_PASSWORD;
    delete process.env.RESEND_API_KEY;
    mailTransport.verify.mockReset().mockResolvedValue(true);
    mailTransport.sendMail.mockReset().mockResolvedValue({});
    mailTransport.close.mockReset();
    createTransportMock.mockReset().mockReturnValue(mailTransport);
  });

  it.each([
    ["SMTP_HOST", "SMTP_HOST_MISSING"],
    ["SMTP_USER", "SMTP_USER_MISSING"],
    ["SMTP_PASS", "SMTP_PASSWORD_MISSING"],
  ] as const)("validates missing %s without creating a transporter", async (key, code) => {
    delete process.env[key];

    await expect(
      emailService.sendEmail({
        to: "person@example.test",
        subject: "Test",
        text: "Plain text",
        html: "<p>HTML</p>",
      })
    ).rejects.toMatchObject({ code });

    expect(createTransportMock).not.toHaveBeenCalled();
  });

  it("creates and reuses an authenticated STARTTLS transporter", async () => {
    const message = {
      to: "person@example.test",
      subject: "Test",
      text: "Plain text",
      html: "<p>HTML</p>",
    };

    await emailService.sendEmail(message);
    await emailService.sendEmail(message);

    expect(createTransportMock).toHaveBeenCalledTimes(1);
    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: "sender@example.test",
          pass: "test-app-password",
        },
      })
    );
    expect(mailTransport.sendMail).toHaveBeenCalledWith({
      ...message,
      from: "Socially <sender@example.test>",
    });
  });

  it("uses secure TLS for SMTP port 465", async () => {
    process.env.SMTP_HOST = "smtp.gmail.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_SECURE = "true";

    await emailService.verifyEmailConnection();

    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        requireTLS: false,
      })
    );
    expect(mailTransport.verify).toHaveBeenCalledTimes(1);
  });

  it("uses Resend SMTP credentials when RESEND_API_KEY is configured", async () => {
    process.env.RESEND_API_KEY = "re_test_api_key";

    await emailService.verifyEmailConnection();

    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.resend.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: "resend",
          pass: "re_test_api_key",
        },
      })
    );
    expect(mailTransport.verify).toHaveBeenCalledTimes(1);
  });

  it("requires a configured sender address when using Resend", async () => {
    process.env.RESEND_API_KEY = "re_test_api_key";
    delete process.env.SMTP_FROM;

    await expect(
      emailService.sendEmail({
        to: "person@example.test",
        subject: "Test",
        text: "Plain text",
        html: "<p>HTML</p>",
      })
    ).rejects.toMatchObject({ code: "SMTP_FROM_MISSING" });

    expect(createTransportMock).not.toHaveBeenCalled();
  });

  it("supports the previous SMTP_PASSWORD environment variable name", async () => {
    delete process.env.SMTP_PASS;
    process.env.SMTP_PASSWORD = "legacy-app-password";

    await emailService.verifyEmailConnection();

    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        auth: {
          user: "sender@example.test",
          pass: "legacy-app-password",
        },
      })
    );
  });

  it("reports SMTP verification failures without logging sensitive details", async () => {
    mailTransport.verify.mockRejectedValue(
      Object.assign(new Error("authentication failed"), { code: "EAUTH" })
    );
    const errorLog = jest.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(emailService.verifyEmailConnection()).rejects.toMatchObject({
      code: "SMTP_VERIFY_FAILED",
    });

    expect(errorLog).toHaveBeenCalledWith(
      "SMTP connection verification failed (EAUTH)."
    );
    errorLog.mockRestore();
  });

  it("reports send failures without exposing SMTP credentials", async () => {
    mailTransport.sendMail.mockRejectedValue(
      Object.assign(new Error("authentication failed"), { code: "EAUTH" })
    );
    const errorLog = jest.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(
      emailService.sendEmail({
        to: "person@example.test",
        subject: "Test",
        text: "Plain text",
        html: "<p>HTML</p>",
      })
    ).rejects.toMatchObject({ code: "SMTP_SEND_FAILED" });

    expect(errorLog).toHaveBeenCalledWith("SMTP email delivery failed (EAUTH).");
    errorLog.mockRestore();
  });
});
