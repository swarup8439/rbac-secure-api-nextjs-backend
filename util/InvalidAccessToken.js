import mongoose from "mongoose";

const invalidAccessTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, expires: "1h" },
});

const InvalidAccessToken =
  mongoose.models.InvalidAccessToken ||
  mongoose.model("InvalidAccessToken", invalidAccessTokenSchema);

export default InvalidAccessToken;
