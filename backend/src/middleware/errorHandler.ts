import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  const duplicateKey =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000;
  const parserStatus =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
      ? error.status
      : undefined;
  const statusCode =
    error instanceof AppError
      ? error.statusCode
      : error instanceof ZodError
        ? 400
        : duplicateKey
          ? 409
          : parserStatus === 400 || parserStatus === 413
            ? parserStatus
            : 500;
  const message =
    error instanceof AppError
      ? error.message
      : parserStatus === 400
        ? "Invalid request body"
        : parserStatus === 413
          ? "Request body is too large"
      : duplicateKey
        ? "An account with these details already exists"
        : statusCode === 500
          ? "Internal server error"
          : "Request failed";

  if (statusCode === 500) {
    console.error(
      "Unhandled API error:",
      error instanceof Error ? error.message : "Unknown error"
    );
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};
