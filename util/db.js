import mongoose from "mongoose";

const MONGODB_URI = process.env.DATABASE_URI;

if (!MONGODB_URI) {
  throw new Error("⚠️ DATABASE_URI is missing in environment variables!");
}

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) {
      return;
    }

    await mongoose.connect(MONGODB_URI);
  } catch (error) {
    console.error("❌ Database connection error:", error);
    throw new Error("Failed to connect to database");
  }
};

export default connectDB;
