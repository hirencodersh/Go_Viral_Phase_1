import fs from "fs";
import path from "path";
import type { RequestHandler } from "express";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { postService } from "../services/post.service";
import {
  createPostSchema,
  explorePostsQuerySchema,
} from "../validators/post.validation";

const publicMediaUrl = (mediaUrl: string, req: Parameters<RequestHandler>[0]) => {
  if (/^https?:\/\//i.test(mediaUrl)) return mediaUrl;
  const baseUrl = (
    process.env.PUBLIC_API_URL || `${req.protocol}://${req.get("host")}`
  ).replace(/\/$/, "");
  return `${baseUrl}${mediaUrl.startsWith("/") ? "" : "/"}${mediaUrl}`;
};

const removeUploadedFile = async (filePath: string): Promise<void> => {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return;
    }
    console.error("Failed to remove an unpersisted post upload:", error);
  }
};

const postForResponse = (
  post: Awaited<ReturnType<typeof postService.getFeed>>[number],
  req: Parameters<RequestHandler>[0]
) => ({
  ...post,
  mediaUrl: publicMediaUrl(post.mediaUrl, req),
  author: {
    ...post.author,
    profilePhoto: post.author.profilePhoto
      ? publicMediaUrl(post.author.profilePhoto, req)
      : "",
  },
});

export const getPosts = asyncHandler(async (req, res) => {
  if (!req.auth) throw new AppError(401, "Authentication required");

  const posts = await postService.getFeed();
  res.status(200).json({
    success: true,
    message: "Posts fetched successfully",
    data: posts.map((post) => postForResponse(post, req)),
  });
});

export const getExplorePosts = asyncHandler(async (req, res) => {
  if (!req.auth) throw new AppError(401, "Authentication required");

  const parsed = explorePostsQuerySchema.safeParse(req.query);
  if (!parsed.success) throw parsed.error;

  const page = await postService.getExploreFeed(
    parsed.data.limit,
    parsed.data.cursor
  );
  res.status(200).json({
    success: true,
    message: "Explore feed fetched successfully",
    data: {
      ...page,
      posts: page.posts.map((post) => postForResponse(post, req)),
    },
  });
});

export const createPost: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.auth) throw new AppError(401, "Authentication required");
  if (!req.file) {
    throw new AppError(400, "A photo or video file is required");
  }

  const parsed = createPostSchema.safeParse(req.body);
  if (!parsed.success) {
    await removeUploadedFile(req.file.path);
    throw parsed.error;
  }

  const mediaType = req.file.mimetype.startsWith("image/") ? "image" : "video";
  let post: Awaited<ReturnType<typeof postService.createPost>>;
  try {
    post = await postService.createPost({
      authorId: req.auth.userId,
      mediaUrl: `/uploads/${path.basename(req.file.filename)}`,
      mediaType,
      title: parsed.data.title,
      caption: parsed.data.caption,
    });
  } catch (error) {
    await removeUploadedFile(req.file.path);
    throw error;
  }

  res.status(201).json({
    success: true,
    message: "Post published successfully",
    data: postForResponse(post, req),
  });
});
