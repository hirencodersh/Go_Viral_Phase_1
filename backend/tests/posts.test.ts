import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../src/app";
import { postService } from "../src/services/post.service";

jest.mock("../src/services/post.service", () => ({
  postService: {
    createPost: jest.fn(),
    getFeed: jest.fn(),
    getExploreFeed: jest.fn(),
  },
}));

const service = jest.mocked(postService);
const secret = "test-secret-with-more-than-thirty-two-characters";
const authorId = "507f1f77bcf86cd799439011";
const uploadDirectory = path.resolve(process.env.UPLOAD_DIR || "uploads");
const createdFiles: string[] = [];

const makePost = (
  input: Parameters<typeof postService.createPost>[0]
) => ({
  id: "607f1f77bcf86cd799439012",
  title: input.title,
  caption: input.caption,
  mediaUrl: input.mediaUrl,
  mediaType: input.mediaType,
  createdAt: "2026-11-26T06:00:00.000Z",
  author: {
    id: authorId,
    username: "taylor.sample",
    fullName: "Taylor Sample",
    profilePhoto: "",
  },
});

describe("Posts API", () => {
  const authorizationCookie = () => {
    const token = jwt.sign(
      { sub: authorId, dob: "1990-05-12" },
      secret,
      { expiresIn: "1h" }
    );
    return `social_access_token=${token}`;
  };

  beforeEach(() => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = secret;
    service.createPost.mockReset();
    service.getFeed.mockReset();
    service.getExploreFeed.mockReset();
    service.createPost.mockImplementation(async (input) => {
      createdFiles.push(
        path.resolve(uploadDirectory, path.basename(input.mediaUrl))
      );
      return makePost(input);
    });
  });

  afterEach(() => {
    for (const filePath of createdFiles.splice(0)) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  });

  it("requires authentication for the feeds and upload endpoint", async () => {
    const feed = await request(app).get("/api/posts");
    const explore = await request(app).get("/api/posts/explore");
    const upload = await request(app)
      .post("/api/posts")
      .field("title", "An image")
      .attach("media", Buffer.from("image"), {
        filename: "image.png",
        contentType: "image/png",
      });

    expect(feed.status).toBe(401);
    expect(explore.status).toBe(401);
    expect(upload.status).toBe(401);
    expect(service.createPost).not.toHaveBeenCalled();
  });

  it("returns cursor-paginated Explore posts from all users", async () => {
    const cursor = "encoded-cursor";
    service.getExploreFeed.mockResolvedValue({
      posts: [
        makePost({
          authorId,
          mediaUrl: "/uploads/community.png",
          mediaType: "image",
          title: "Community post",
          caption: "Hello",
        }),
      ],
      nextCursor: cursor,
    });

    const response = await request(app)
      .get(`/api/posts/explore?limit=7&cursor=${cursor}`)
      .set("Cookie", authorizationCookie());

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      posts: [{ title: "Community post", mediaType: "image" }],
      nextCursor: cursor,
    });
    expect(response.body.data.posts[0].mediaUrl).toContain(
      "/uploads/community.png"
    );
    expect(service.getExploreFeed).toHaveBeenCalledWith(7, cursor);
  });

  it("rejects Explore limits outside the supported range", async () => {
    const response = await request(app)
      .get("/api/posts/explore?limit=51")
      .set("Cookie", authorizationCookie());

    expect(response.status).toBe(400);
    expect(service.getExploreFeed).not.toHaveBeenCalled();
  });

  it("creates an image post with its metadata", async () => {
    const response = await request(app)
      .post("/api/posts")
      .set("Cookie", authorizationCookie())
      .field("title", "A sunny day")
      .field("caption", "A walk in the park")
      .attach("media", Buffer.from("image content"), {
        filename: "sunny.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      message: "Post published successfully",
      data: {
        title: "A sunny day",
        caption: "A walk in the park",
        mediaType: "image",
        author: { username: "taylor.sample" },
      },
    });
    expect(response.body.data.mediaUrl).toContain("/uploads/");
    expect(service.createPost).toHaveBeenCalledWith(
      expect.objectContaining({
        authorId,
        title: "A sunny day",
        caption: "A walk in the park",
        mediaType: "image",
      })
    );
  });

  it("creates a video post and returns persisted posts in the feed", async () => {
    const createdPost = makePost({
      authorId,
      mediaUrl: "/uploads/test-video.mp4",
      mediaType: "video",
      title: "A short clip",
      caption: "",
    });
    service.createPost.mockImplementation(async (input) => {
      createdFiles.push(
        path.resolve(uploadDirectory, path.basename(input.mediaUrl))
      );
      return { ...createdPost, mediaUrl: input.mediaUrl };
    });
    service.getFeed.mockResolvedValue([createdPost]);

    const upload = await request(app)
      .post("/api/posts")
      .set("Cookie", authorizationCookie())
      .field("title", "A short clip")
      .attach("media", Buffer.from("video content"), {
        filename: "clip.mp4",
        contentType: "video/mp4",
      });
    const feed = await request(app)
      .get("/api/posts")
      .set("Cookie", authorizationCookie());

    expect(upload.status).toBe(201);
    expect(upload.body.data.mediaType).toBe("video");
    expect(feed.status).toBe(200);
    expect(feed.body.data).toHaveLength(1);
    expect(feed.body.data[0]).toMatchObject({
      title: "A short clip",
      mediaType: "video",
    });
    expect(service.getFeed).toHaveBeenCalledTimes(1);
  });

  it("rejects unsupported media and missing titles", async () => {
    const unsupported = await request(app)
      .post("/api/posts")
      .set("Cookie", authorizationCookie())
      .field("title", "Not an image")
      .attach("media", Buffer.from("text"), {
        filename: "notes.txt",
        contentType: "text/plain",
      });
    const missingTitle = await request(app)
      .post("/api/posts")
      .set("Cookie", authorizationCookie())
      .attach("media", Buffer.from("image content"), {
        filename: "image.png",
        contentType: "image/png",
      });

    expect(unsupported.status).toBe(400);
    expect(unsupported.body.message).toMatch(/JPG, PNG, or WebP/);
    expect(missingTitle.status).toBe(400);
    expect(missingTitle.body.message).toBe("Validation failed");
    expect(service.createPost).not.toHaveBeenCalled();
  });
});
