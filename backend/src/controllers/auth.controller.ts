import type { RequestHandler } from "express";
import { authCookieOptions, AUTH_COOKIE_NAME } from "../middleware/authenticate";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { authService } from "../services/auth.service";
import { passwordResetService } from "../services/passwordReset.service";
import type { LoginInput, RegisterInput } from "../types/auth.types";

const rememberMeCookieAge = 30 * 24 * 60 * 60 * 1000;

const sendAuthResponse = (
  res: Parameters<RequestHandler>[1],
  result: Awaited<ReturnType<typeof authService.login | typeof authService.register>>,
  statusCode = 200
) => {
  const cookieOptions = authCookieOptions();
  if (result.rememberMe) {
    res.cookie(AUTH_COOKIE_NAME, result.token, {
      ...cookieOptions,
      maxAge: rememberMeCookieAge,
    });
  } else {
    res.cookie(AUTH_COOKIE_NAME, result.token, cookieOptions);
  }

  res.status(statusCode).json({
    success: true,
    message: statusCode === 201 ? "Account created successfully" : "Login successful",
    data: { user: result.user },
  });
};

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body as RegisterInput);
  sendAuthResponse(res, result, 201);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body as LoginInput);
  sendAuthResponse(res, result);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await passwordResetService.requestReset(req.body.email);
  res.status(202).json({
    success: true,
    message: "If an account exists for this email, reset instructions have been sent.",
    data: null,
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await passwordResetService.resetPassword(req.body.token, req.body.password);
  res.status(200).json({
    success: true,
    message: "Your password has been reset. You can now sign in.",
    data: null,
  });
});

export const logout: RequestHandler = (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions());
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
    data: null,
  });
};

export const me = asyncHandler(async (req, res) => {
  if (!req.auth) {
    throw new AppError(401, "Authentication required");
  }

  const user = await authService.getCurrentUser(req.auth.userId);
  const profilePhoto = user.profilePhoto && user.profilePhoto.startsWith("/")
    ? `${(process.env.PUBLIC_API_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "")}${user.profilePhoto}`
    : user.profilePhoto;
  res.status(200).json({
    success: true,
    message: "Authenticated user",
    data: { user: { ...user, profilePhoto } },
  });
});
