import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    uname: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: false },
    role: {
      type: String,
      enum: ["admin", "moderator", "member"],
      default: "member",
      required: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
