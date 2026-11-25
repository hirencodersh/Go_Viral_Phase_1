import { User, type UserRole } from "../models/User";
import { AppError } from "../utils/AppError";

export interface ProfileData {
  _id: string;
  username: string;
  email: string;
  profilePhoto: string;
  bio: string;
  roles: UserRole[];
}

const duplicateField = (error: unknown): "email" | "username" | undefined => {
  if (typeof error === "object" && error !== null && "keyPattern" in error) {
    const keyPattern = (error as { keyPattern: Record<string, unknown> }).keyPattern;
    if ("username" in keyPattern) return "username";
    if ("email" in keyPattern) return "email";
  }
  return undefined;
};

const toProfile = (user: any): ProfileData => ({
  _id: user._id.toString(),
  username: user.username,
  email: user.email,
  profilePhoto: user.profilePhoto || "",
  bio: user.bio || "",
  roles: user.roles?.length ? user.roles : ["fan"],
});

export const profileService = {
  async getProfile(userId: string): Promise<ProfileData> {
    const user = await User.findById(userId).select("-password");
    if (!user) throw new AppError(401, "Authentication is no longer valid");
    return toProfile(user);
  },

  async updateProfile(
    userId: string,
    input: { username: string; bio: string }
  ): Promise<ProfileData> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { username: input.username, bio: input.bio },
        { new: true, runValidators: true }
      ).select("-password");
      if (!user) throw new AppError(401, "Authentication is no longer valid");
      return toProfile(user);
    } catch (error) {
      const field = duplicateField(error);
      if (field === "username") throw new AppError(409, "Username is already taken");
      throw error;
    }
  },

  async updateRoles(userId: string, roles: UserRole[]): Promise<ProfileData> {
    const user = await User.findByIdAndUpdate(
      userId,
      { roles },
      { new: true, runValidators: true }
    ).select("-password");
    if (!user) throw new AppError(401, "Authentication is no longer valid");
    return toProfile(user);
  },

  async updatePhoto(userId: string, profilePhoto: string): Promise<ProfileData> {
    const user = await User.findByIdAndUpdate(
      userId,
      { profilePhoto },
      { new: true, runValidators: true }
    ).select("-password");
    if (!user) throw new AppError(401, "Authentication is no longer valid");
    return toProfile(user);
  },
};
