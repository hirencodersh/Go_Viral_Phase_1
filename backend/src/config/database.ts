
import mongoose from "mongoose";
import { User } from "../models/User";

const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGO_URI?.trim();

  if (!mongoURI) {
    throw new Error("MONGO_URI is missing from environment variables");
  }

  await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 10000 });
  await User.init();

  console.log("MongoDB connected successfully!");
  console.log(`Database: ${mongoose.connection.name}`);
};

export default connectDB;
