import jwt from "jsonwebtoken";
import type { RequestHandler } from "express";
import { getJwtSecret } from "../config/env";
import { AppError } from "../utils/AppError";
import { User } from "../models/User";
import { AGE_RESTRICTION_MESSAGE, calculateAge } from "../utils/age";

export const AUTH_COOKIE_NAME = "social_access_token";

export const authenticate: RequestHandler = (req, _res, next) => {
  const authorizationHeader = req.get("authorization");
  let token: unknown;

  if (authorizationHeader !== undefined) {
    const bearerMatch = /^Bearer\s+(\S+)$/i.exec(authorizationHeader.trim());
    if (!bearerMatch) {
      next(new AppError(401, "Invalid or expired authentication token"));
      return;
    }
    token = bearerMatch[1];
  } else {
    token = req.cookies?.[AUTH_COOKIE_NAME];
  }

  if (typeof token !== "string" || token.length === 0) {
    next(new AppError(401, "Authentication required"));
    return;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (typeof payload !== "object" || typeof payload.sub !== "string") {
      throw new AppError(401, "Invalid or expired authentication token");
    }
    if (payload.dob !== undefined) {
      if (typeof payload.dob !== "string") {
        throw new AppError(401, "Invalid or expired authentication token");
      }
      const age = calculateAge(payload.dob);
      if (age === null) {
        throw new AppError(401, "Invalid or expired authentication token");
      }
      if (age < 18) {
        throw new AppError(403, AGE_RESTRICTION_MESSAGE);
      }
      req.auth = { userId: payload.sub };
      next();
      return;
    }

    void User.findById(payload.sub)
      .select("dateOfBirth")
      .then((user) => {
        if (!user) {
          next(new AppError(401, "Authentication is no longer valid"));
          return;
        }
        if (user.dateOfBirth && (calculateAge(user.dateOfBirth) ?? -1) < 18) {
          next(new AppError(403, AGE_RESTRICTION_MESSAGE));
          return;
        }
        req.auth = { userId: payload.sub as string };
        next();
      })
      .catch(next);
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(401, "Invalid or expired authentication token")
    );
  }
};

export const authCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
});
