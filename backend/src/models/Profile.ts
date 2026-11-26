import mongoose, { Schema, Types } from "mongoose";

export type UserRole = "fan" | "creator";

interface ProfileRecord {
  user: Types.ObjectId;
  fullName: string;
  username: string;
  profilePhoto: string;
  bio: string;
  roles: UserRole[];
  createdAt: Date;
  updatedAt: Date;
}

const profileSchema = new Schema<ProfileRecord>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    username: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    profilePhoto: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2048,
    },
    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: 250,
    },
    roles: {
      type: [String],
      enum: ["fan", "creator"],
      default: ["fan"],
      validate: {
        validator: (roles: string[]) =>
          roles.length > 0 && new Set(roles).size === roles.length,
        message: "At least one unique role is required.",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

profileSchema.index({ user: 1 }, { unique: true, name: "profile_user_unique" });
profileSchema.index(
  { username: 1 },
  { unique: true, name: "profile_username_unique" }
);

export const Profile = mongoose.model<ProfileRecord>("Profile", profileSchema);
