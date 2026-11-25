import "dotenv/config";
import app from "./app";
import connectDB from "./config/database";
import { getConfig } from "./config/env";
import { ZodError } from "zod";

const startServer = async (): Promise<void> => {
  try {
    const config = getConfig();

    await connectDB();

    app.listen(config.PORT, () => {
      console.log(`Server running on http://localhost:${config.PORT}`);
      console.log(`Environment: ${config.NODE_ENV}`);
    });
  } catch (error) {
    console.error(
      "Server startup failed:",
      error instanceof ZodError
        ? error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; ")
        : error instanceof Error
          ? error.message
          : "Unknown startup error"
    );
    process.exitCode = 1;
  }
};

startServer();
