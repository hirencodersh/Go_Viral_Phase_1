import mongoose, { Schema, Types } from "mongoose";

export type PostMediaType = "image" | "video";

export interface PostRecord {
  author: Types.ObjectId;
  mediaUrl: string;
  mediaType: PostMediaType;
  title: string;
  caption: string;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<PostRecord>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mediaUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
    },
    mediaType: {
      type: String,
      required: true,
      enum: ["image", "video"],
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    caption: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

postSchema.index({ createdAt: -1 }, { name: "posts_feed_created_at" });
postSchema.index(
  { createdAt: -1, _id: -1 },
  { name: "posts_explore_cursor" }
);
postSchema.index({ author: 1, createdAt: -1 }, { name: "posts_by_author" });

export const Post = mongoose.model<PostRecord>("Post", postSchema);
