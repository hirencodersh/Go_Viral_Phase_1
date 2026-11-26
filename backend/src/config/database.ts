
import mongoose from "mongoose";
import { migrateLegacyProfiles } from "./migrateLegacyProfiles";
import { Post } from "../models/Post";
import { Profile } from "../models/Profile";
import { User } from "../models/User";

const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGO_URI?.trim();

  if (!mongoURI) {
    throw new Error("MONGO_URI is missing from environment variables");
  }

  await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 10000 });
  await Promise.all([User.init(), Profile.init(), Post.init()]);
  await migrateLegacyProfiles();

  console.log("MongoDB connected successfully!");
  console.log(`Database: ${mongoose.connection.name}`);
};

export default connectDB;
