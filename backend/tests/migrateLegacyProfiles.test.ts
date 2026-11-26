import { Types } from "mongoose";
import { Profile } from "../src/models/Profile";
import { User } from "../src/models/User";
import { migrateLegacyProfiles } from "../src/config/migrateLegacyProfiles";

jest.mock("../src/models/Profile", () => ({
  Profile: {
    updateOne: jest.fn(),
    exists: jest.fn(),
  },
}));

jest.mock("../src/models/User", () => ({
  User: {
    collection: {
      find: jest.fn(),
      indexes: jest.fn(),
      dropIndex: jest.fn(),
      updateOne: jest.fn(),
    },
  },
}));

const userId = new Types.ObjectId("507f1f77bcf86cd799439011");
const legacyUser = {
  _id: userId,
  fullName: "Taylor Sample",
  username: "taylor.sample",
  profilePhoto: "/uploads/taylor.png",
  bio: "Hello",
  roles: ["fan", "creator"],
};

const setupLegacyUserQuery = (users: typeof legacyUser[]) => {
  const toArray = jest.fn().mockResolvedValue(users);
  const project = jest.fn().mockReturnValue({ toArray });
  jest.mocked(User.collection.find).mockReturnValue({ project } as never);
};

describe("migrateLegacyProfiles", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupLegacyUserQuery([legacyUser]);
    jest.mocked(User.collection.indexes).mockResolvedValue([
      { name: "username_unique", key: { username: 1 }, unique: true },
    ] as never);
    jest.mocked(User.collection.dropIndex).mockResolvedValue({} as never);
    jest.mocked(User.collection.updateOne).mockResolvedValue({} as never);
    jest.mocked(Profile.updateOne).mockResolvedValue({} as never);
  });

  it("copies existing profile data before dropping old fields and its username index", async () => {
    await migrateLegacyProfiles();

    expect(Profile.updateOne).toHaveBeenCalledWith(
      { user: userId },
      {
        $setOnInsert: {
          user: userId,
          fullName: "Taylor Sample",
          username: "taylor.sample",
          profilePhoto: "/uploads/taylor.png",
          bio: "Hello",
          roles: ["fan", "creator"],
        },
      },
      { upsert: true }
    );
    expect(User.collection.dropIndex).toHaveBeenCalledWith("username_unique");
    expect(User.collection.updateOne).toHaveBeenCalledWith(
      { _id: userId },
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
    expect(
      jest.mocked(User.collection.dropIndex).mock.invocationCallOrder[0]
    ).toBeLessThan(
      jest.mocked(User.collection.updateOne).mock.invocationCallOrder[0]
    );
  });

  it("preserves legacy user fields when profile migration cannot be completed", async () => {
    const duplicateError = Object.assign(new Error("Duplicate username"), {
      code: 11000,
    });
    jest.mocked(Profile.updateOne).mockRejectedValue(duplicateError);
    jest.mocked(Profile.exists).mockResolvedValue(null);

    await expect(migrateLegacyProfiles()).rejects.toBe(duplicateError);

    expect(User.collection.updateOne).not.toHaveBeenCalled();
  });
});
