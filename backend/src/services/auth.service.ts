import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Profile } from "../models/Profile";
import { User } from "../models/User";
import { getJwtSecret } from "../config/env";
import { AppError } from "../utils/AppError";
import { AGE_RESTRICTION_MESSAGE, calculateAge } from "../utils/age";
import type {
  AuthResult,
  LoginInput,
  PublicUser,
  RegisterInput,
} from "../types/auth.types";

const BCRYPT_ROUNDS = 12;
const TERMS_VERSION = "1.0";

const toPublicUser = (
  user: {
  _id: { toString(): string };
  email: string;
  },
  profile: {
    fullName: string;
    username: string;
    profilePhoto: string;
    bio: string;
    roles: ("fan" | "creator")[];
  }
): PublicUser => ({
  id: user._id.toString(),
  _id: user._id.toString(),
  fullName: profile.fullName,
  username: profile.username,
  email: user.email,
  profilePhoto: profile.profilePhoto || "",
  bio: profile.bio || "",
  roles: profile.roles?.length ? profile.roles : ["fan"],
});

const createToken = (userId: string, rememberMe: boolean, dateOfBirth?: Date | string): string => {
  const birthDate =
    dateOfBirth instanceof Date
      ? dateOfBirth.toISOString().slice(0, 10)
      : dateOfBirth;
  return jwt.sign({ sub: userId, dob: birthDate }, getJwtSecret(), {
    expiresIn: rememberMe ? "30d" : "1d",
  });
};

const duplicateField = (error: unknown): string | undefined => {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000 &&
    "keyPattern" in error &&
    typeof error.keyPattern === "object" &&
    error.keyPattern !== null
  ) {
    const fields = error.keyPattern as Record<string, unknown>;
    return "email" in fields ? "email" : "username" in fields ? "username" : undefined;
  }

  return undefined;
};

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const { fullName, username, email, dateOfBirth, password, termsAccepted } = input;
    const birthDate = new Date(`${dateOfBirth}T00:00:00.000Z`);
    if ((calculateAge(birthDate) ?? -1) < 18) {
      throw new AppError(403, AGE_RESTRICTION_MESSAGE);
    }

    const existingEmail = await User.findOne({ email }).select("email");
    if (existingEmail) {
      throw new AppError(409, "Email address is already registered");
    }

    const existingUsername = await Profile.findOne({ username }).select(
      "username"
    );
    if (existingUsername) {
      throw new AppError(409, "Username is already taken");
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    let user;

    try {
      user = await User.create({
        email,
        dateOfBirth: birthDate,
        password: passwordHash,
        termsAccepted,
        termsAcceptedAt: new Date(),
        termsVersion: TERMS_VERSION,
      });
    } catch (error) {
      const field = duplicateField(error);
      if (field === "email") {
        throw new AppError(409, "Email address is already registered");
      }
      throw error;
    }

    let profile;
    try {
      profile = await Profile.create({
        user: user._id,
        fullName,
        username,
        roles: ["fan"],
      });
    } catch (error) {
      try {
        await User.deleteOne({ _id: user._id });
      } catch (cleanupError) {
        console.error("Failed to roll back account without a profile:", cleanupError);
      }
      if (duplicateField(error) === "username") {
        throw new AppError(409, "Username is already taken");
      }
      throw error;
    }

    return {
      token: createToken(user._id.toString(), false, birthDate),
      rememberMe: false,
      user: toPublicUser(user, profile),
    };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await User.findOne({ email: input.email }).select("+password");
    if (!user || !(await bcrypt.compare(input.password, user.password))) {
      throw new AppError(401, "Invalid email or password");
    }
    if (user.dateOfBirth && (calculateAge(user.dateOfBirth) ?? -1) < 18) {
      throw new AppError(403, AGE_RESTRICTION_MESSAGE);
    }

    const profile = await Profile.findOne({ user: user._id });
    if (!profile) {
      throw new AppError(500, "Account profile is unavailable");
    }

    return {
      token: createToken(user._id.toString(), input.rememberMe, user.dateOfBirth),
      rememberMe: input.rememberMe,
      user: toPublicUser(user, profile),
    };
  },

  async getCurrentUser(userId: string): Promise<PublicUser> {
    const user = await User.findById(userId).select("email");
    if (!user) {
      throw new AppError(401, "Authentication is no longer valid");
    }

    const profile = await Profile.findOne({ user: user._id });
    if (!profile) {
      throw new AppError(500, "Account profile is unavailable");
    }

    return toPublicUser(user, profile);
  },
};
