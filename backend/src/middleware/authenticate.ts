import jwt from "jsonwebtoken";
import type { RequestHandler } from "express";
import { getJwtSecret } from "../config/env";
import { AppError } from "../utils/AppError";

export const AUTH_COOKIE_NAME = "social_access_token";

export const authenticate: RequestHandler = (req, _res, next) => {
  const token: unknown = req.cookies?.[AUTH_COOKIE_NAME];
  if (typeof token !== "string" || token.length === 0) {
    next(new AppError(401, "Authentication required"));
    return;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (typeof payload !== "object" || typeof payload.sub !== "string") {
      throw new AppError(401, "Invalid or expired authentication token");
    }
    req.auth = { userId: payload.sub };
    next();
  } catch {
    next(new AppError(401, "Invalid or expired authentication token"));
  }
};

export const authCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
});
