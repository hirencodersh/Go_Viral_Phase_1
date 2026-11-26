import { randomUUID } from "crypto";
import fs from "fs";
import multer from "multer";
import path from "path";
import { AppError } from "../utils/AppError";

const uploadDirectory = path.resolve(process.env.UPLOAD_DIR || "uploads");
const maxPostMediaSize = 50 * 1024 * 1024;
const mediaExtensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, file, callback) => {
    callback(null, `${randomUUID()}${mediaExtensions[file.mimetype]}`);
  },
});

export const postMediaUpload = multer({
  storage,
  limits: {
    fileSize: maxPostMediaSize,
    files: 1,
    fields: 2,
    fieldNameSize: 100,
    fieldSize: 10 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!mediaExtensions[file.mimetype]) {
      callback(
        new AppError(
          400,
          "Choose a JPG, PNG, or WebP image, or an MP4, WebM, or MOV video."
        )
      );
      return;
    }
    callback(null, true);
  },
}).single("media");
