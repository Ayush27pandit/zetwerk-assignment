import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { config } from "./env";

let mongoServer: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<void> => {
  try {
    // Try to connect to the configured URI first
    await mongoose.connect(config.mongodbUri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err);
});
