import { Profile, type UserRole } from "../models/Profile";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";

export interface ProfileData {
  _id: string;
  username: string;
  email: string;
  profilePhoto: string;
  bio: string;
  roles: UserRole[];
}

const duplicateUsername = (error: unknown): boolean => {
  if (typeof error === "object" && error !== null && "keyPattern" in error) {
    const keyPattern = (error as { keyPattern: Record<string, unknown> }).keyPattern;
    return "username" in keyPattern;
  }
  return false;
};

const toProfile = (
  user: { _id: { toString(): string }; email: string },
  profile: {
    username: string;
    profilePhoto: string;
    bio: string;
    roles: UserRole[];
  }
): ProfileData => ({
  _id: user._id.toString(),
  username: profile.username,
  email: user.email,
  profilePhoto: profile.profilePhoto || "",
  bio: profile.bio || "",
  roles: profile.roles?.length ? profile.roles : ["fan"],
});

export const profileService = {
  async getProfile(userId: string): Promise<ProfileData> {
    const [user, profile] = await Promise.all([
      User.findById(userId).select("email"),
      Profile.findOne({ user: userId }),
    ]);
    if (!user) throw new AppError(401, "Authentication is no longer valid");
    if (!profile) throw new AppError(404, "Profile not found");
    return toProfile(user, profile);
  },

  async updateProfile(
    userId: string,
    input: { username: string; bio: string }
  ): Promise<ProfileData> {
    try {
      const profile = await Profile.findOneAndUpdate(
        { user: userId },
        { username: input.username, bio: input.bio },
        { new: true, runValidators: true }
      );
      if (!profile) throw new AppError(404, "Profile not found");
      return await this.getProfile(userId);
    } catch (error) {
      if (duplicateUsername(error)) {
        throw new AppError(409, "Username is already taken");
      }
      throw error;
    }
  },

  async updateRoles(userId: string, roles: UserRole[]): Promise<ProfileData> {
    const profile = await Profile.findOneAndUpdate(
      { user: userId },
      { roles },
      { new: true, runValidators: true }
    );
    if (!profile) throw new AppError(404, "Profile not found");
    return this.getProfile(userId);
  },

  async updatePhoto(userId: string, profilePhoto: string): Promise<ProfileData> {
    const profile = await Profile.findOneAndUpdate(
      { user: userId },
      { profilePhoto },
      { new: true, runValidators: true }
    );
    if (!profile) throw new AppError(404, "Profile not found");
    return this.getProfile(userId);
  },
};
