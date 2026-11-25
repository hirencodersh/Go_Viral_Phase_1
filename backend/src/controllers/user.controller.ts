import type { RequestHandler } from "express";
import path from "path";
import fs from "fs";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { profileService } from "../services/profile.service";

const profilePhotoUrl = (storageKey: string, req: Parameters<RequestHandler>[0]) => {
  if (!storageKey) return "";
  if (/^https?:\/\//i.test(storageKey)) return storageKey;
  const baseUrl = (process.env.PUBLIC_API_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
  return `${baseUrl}${storageKey.startsWith("/") ? "" : "/"}${storageKey}`;
};

const responseProfile = (profile: Awaited<ReturnType<typeof profileService.getProfile>>, req: Parameters<RequestHandler>[0]) => ({
  ...profile,
  profilePhoto: profilePhotoUrl(profile.profilePhoto, req),
});

export const getProfile = asyncHandler(async (req, res) => {
  if (!req.auth) throw new AppError(401, "Authentication required");
  const profile = await profileService.getProfile(req.auth.userId);
  res.status(200).json({
    success: true,
    message: "Profile fetched successfully",
    data: responseProfile(profile, req),
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  if (!req.auth) throw new AppError(401, "Authentication required");
  const profile = await profileService.updateProfile(req.auth.userId, req.body);
  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: responseProfile(profile, req),
  });
});

export const updateRoles = asyncHandler(async (req, res) => {
  if (!req.auth) throw new AppError(401, "Authentication required");
  const profile = await profileService.updateRoles(req.auth.userId, req.body.roles);
  res.status(200).json({
    success: true,
    message: "Account type updated successfully",
    data: responseProfile(profile, req),
  });
});

export const uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.auth) throw new AppError(401, "Authentication required");
  if (!req.file) throw new AppError(400, "A profile photo file is required");

  const storageKey = `/uploads/${path.basename(req.file.filename)}`;
  const current = await profileService.getProfile(req.auth.userId);
  if (current.profilePhoto && current.profilePhoto.startsWith("/uploads/")) {
    const oldPath = path.resolve(process.env.UPLOAD_DIR || "uploads", path.basename(current.profilePhoto));
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }
  const profile = await profileService.updatePhoto(req.auth.userId, storageKey);
  res.status(200).json({
    success: true,
    message: "Profile photo uploaded successfully",
    data: responseProfile(profile, req),
  });
});
