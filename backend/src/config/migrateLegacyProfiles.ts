import { Profile, type UserRole } from "../models/Profile";
import { User } from "../models/User";

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === 11000;

export const migrateLegacyProfiles = async (): Promise<void> => {
  const legacyUsers = await User.collection
    .find({
      $or: [
        { fullName: { $exists: true } },
        { username: { $exists: true } },
        { profilePhoto: { $exists: true } },
        { bio: { $exists: true } },
        { roles: { $exists: true } },
      ],
    })
    .project({
      _id: 1,
      fullName: 1,
      username: 1,
      profilePhoto: 1,
      bio: 1,
      roles: 1,
    })
    .toArray();

  for (const legacyUser of legacyUsers) {
    if (
      typeof legacyUser.fullName !== "string" ||
      typeof legacyUser.username !== "string"
    ) {
      throw new Error(
        `Cannot migrate profile for user ${legacyUser._id}: name or username is missing`
      );
    }

    const storedRoles = Array.isArray(legacyUser.roles)
      ? legacyUser.roles.filter(
          (role): role is UserRole => role === "fan" || role === "creator"
        )
      : [];
    const profileData = {
      user: legacyUser._id,
      fullName: legacyUser.fullName,
      username: legacyUser.username,
      profilePhoto:
        typeof legacyUser.profilePhoto === "string"
          ? legacyUser.profilePhoto
          : "",
      bio: typeof legacyUser.bio === "string" ? legacyUser.bio : "",
      roles: storedRoles.length > 0 ? storedRoles : (["fan"] as UserRole[]),
    };

    try {
      await Profile.updateOne(
        { user: legacyUser._id },
        { $setOnInsert: profileData },
        { upsert: true }
      );
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
      const profileExists = await Profile.exists({ user: legacyUser._id });
      if (!profileExists) throw error;
    }
  }

  const legacyUsernameIndexes = (await User.collection.indexes()).filter(
    (index) =>
      index.name === "username_unique" || index.name === "username_1"
  );
  for (const index of legacyUsernameIndexes) {
    try {
      await User.collection.dropIndex(index.name!);
    } catch (error) {
      const indexStillExists = (await User.collection.indexes()).some(
        (current) => current.name === index.name
      );
      if (indexStillExists) throw error;
    }
  }

  for (const legacyUser of legacyUsers) {
    await User.collection.updateOne(
      { _id: legacyUser._id },
      {
        $unset: {
          fullName: "",
          username: "",
          profilePhoto: "",
          bio: "",
          roles: "",
        },
      }
    );
  }
};
