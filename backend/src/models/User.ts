import mongoose, { Schema } from "mongoose";

export type UserRole = "fan" | "creator";

const userSchema = new Schema(
  {
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
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    termsAccepted: {
      type: Boolean,
      required: true,
      default: false,
    },
    termsAcceptedAt: {
      type: Date,
      required: true,
    },
    termsVersion: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
    },
    passwordResetExpiresAt: {
      type: Date,
      select: false,
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

userSchema.index({ email: 1 }, { unique: true, name: "email_unique" });
userSchema.index({ username: 1 }, { unique: true, name: "username_unique" });

export const User = mongoose.model("User", userSchema);
