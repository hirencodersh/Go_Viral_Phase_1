import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { getJwtSecret } from "../config/env";
import { AppError } from "../utils/AppError";
import type {
  AuthResult,
  LoginInput,
  PublicUser,
  RegisterInput,
} from "../types/auth.types";

const BCRYPT_ROUNDS = 12;

const toPublicUser = (user: {
  _id: { toString(): string };
  fullName: string;
  username: string;
  email: string;
}): PublicUser => ({
  id: user._id.toString(),
  fullName: user.fullName,
  username: user.username,
  email: user.email,
});

const createToken = (userId: string, rememberMe: boolean): string => {
  return jwt.sign({ sub: userId }, getJwtSecret(), {
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
    const { fullName, username, email, password } = input;
    const existing = await User.findOne({
      $or: [{ email }, { username }],
    }).select("email username");

    if (existing?.email === email) {
      throw new AppError(409, "Email address is already registered");
    }
    if (existing?.username === username) {
      throw new AppError(409, "Username is already taken");
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    let user;

    try {
      user = await User.create({
        fullName,
        username,
        email,
        password: passwordHash,
      });
    } catch (error) {
      const field = duplicateField(error);
      if (field === "email") {
        throw new AppError(409, "Email address is already registered");
      }
      if (field === "username") {
        throw new AppError(409, "Username is already taken");
      }
      throw error;
    }

    return {
      token: createToken(user._id.toString(), false),
      rememberMe: false,
      user: toPublicUser(user),
    };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await User.findOne({ email: input.email }).select("+password");
    if (!user || !(await bcrypt.compare(input.password, user.password))) {
      throw new AppError(401, "Invalid email or password");
    }

    return {
      token: createToken(user._id.toString(), input.rememberMe),
      rememberMe: input.rememberMe,
      user: toPublicUser(user),
    };
  },

  async getCurrentUser(userId: string): Promise<PublicUser> {
    const user = await User.findById(userId).select("fullName username email");
    if (!user) {
      throw new AppError(401, "Authentication is no longer valid");
    }

    return toPublicUser(user);
  },
};
