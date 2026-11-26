import { Types, type FilterQuery } from "mongoose";
import { z } from "zod";
import "../models/Profile";
import { Post, type PostMediaType, type PostRecord } from "../models/Post";
import { AppError } from "../utils/AppError";

interface CreatePostInput {
  authorId: string;
  mediaUrl: string;
  mediaType: PostMediaType;
  title: string;
  caption: string;
}

interface PopulatedAuthor {
  _id: Types.ObjectId;
  profile: {
    username: string;
    fullName: string;
    profilePhoto: string;
  } | null;
}

interface PostEntry {
  id: string;
  title: string;
  caption: string;
  mediaUrl: string;
  mediaType: PostMediaType;
  createdAt: string;
  author: {
    id: string;
    username: string;
    fullName: string;
    profilePhoto: string;
  };
}

interface ExploreFeedPage {
  posts: PostEntry[];
  nextCursor: string | null;
}

const cursorPayloadSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i),
  createdAt: z.string().datetime(),
});

const encodeCursor = (post: PostEntry): string =>
  Buffer.from(
    JSON.stringify({ id: post.id, createdAt: post.createdAt })
  ).toString("base64url");

const decodeCursor = (cursor: string) => {
  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
  } catch {
    throw new AppError(400, "Invalid post feed cursor");
  }

  const parsed = cursorPayloadSchema.safeParse(payload);
  if (!parsed.success) throw new AppError(400, "Invalid post feed cursor");
  return parsed.data;
};

const toPostEntry = (post: {
  _id: Types.ObjectId;
  author: PopulatedAuthor | null;
  title: string;
  caption: string;
  mediaUrl: string;
  mediaType: PostMediaType;
  createdAt: Date;
}): PostEntry => {
  if (!post.author?.profile) {
    throw new AppError(500, "Post author is unavailable");
  }
  const author = post.author.profile;

  return {
    id: post._id.toString(),
    title: post.title,
    caption: post.caption,
    mediaUrl: post.mediaUrl,
    mediaType: post.mediaType,
    createdAt: post.createdAt.toISOString(),
    author: {
      id: post.author._id.toString(),
      username: author.username,
      fullName: author.fullName,
      profilePhoto: author.profilePhoto || "",
    },
  };
};

const authorPopulation = {
  path: "author",
  select: "_id",
  populate: { path: "profile", select: "username fullName profilePhoto" },
};

export const postService = {
  async createPost(input: CreatePostInput): Promise<PostEntry> {
    const post = await Post.create({
      author: new Types.ObjectId(input.authorId),
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType,
      title: input.title,
      caption: input.caption,
    });
    const populated = await post.populate<{ author: PopulatedAuthor | null }>(
      authorPopulation
    );
    return toPostEntry(populated);
  },

  async getFeed(): Promise<PostEntry[]> {
    const posts = await Post.find()
      .sort({ createdAt: -1, _id: -1 })
      .limit(50)
      .populate<{ author: PopulatedAuthor | null }>(authorPopulation);

    return posts.map(toPostEntry);
  },

  async getExploreFeed(
    limit: number,
    cursor?: string
  ): Promise<ExploreFeedPage> {
    const filter: FilterQuery<PostRecord> = {};
    if (cursor) {
      const position = decodeCursor(cursor);
      const createdAt = new Date(position.createdAt);
      filter.$or = [
        { createdAt: { $lt: createdAt } },
        {
          createdAt,
          _id: { $lt: new Types.ObjectId(position.id) },
        },
      ];
    }

    const records = await Post.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate<{ author: PopulatedAuthor | null }>(authorPopulation);
    const hasMore = records.length > limit;
    const posts = records.slice(0, limit).map(toPostEntry);

    return {
      posts,
      nextCursor: hasMore && posts.length > 0
        ? encodeCursor(posts[posts.length - 1])
        : null,
    };
  },
};
