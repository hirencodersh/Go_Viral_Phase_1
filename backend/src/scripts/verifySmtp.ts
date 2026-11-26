import {
  emailService,
  getEmailServiceErrorCode,
} from "../services/email.service";

const verifySmtp = async (): Promise<void> => {
  try {
    await emailService.verifyEmailConnection();
    console.log("SMTP connection verified successfully.");
  } catch (error) {
    console.error(
      "SMTP verification failed:",
      getEmailServiceErrorCode(error)
    );
    process.exitCode = 1;
  }
};

void verifySmtp();
