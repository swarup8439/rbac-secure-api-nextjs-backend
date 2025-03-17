import connectDB from "@/util/db";
import RefreshToken from "@/util/RefreshToken";
import User from "@/util/User";
import { SignJWT, jwtVerify } from "jose";
import { NextResponse } from "next/server";

export async function POST(request) {
  // Ensure the DB connection
  await connectDB();

  // Get the refresh token from the request headers
  const authHeader = request.headers.get("authorization");

  // verify if header is present or not
  if (!authHeader) {
    return NextResponse.json(
      { message: "Refresh token required" },
      { status: 401 }
    );
  }

  // Extract the refresh token from the header
  const refreshToken = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    // Secret key for verifying the refresh token
    const secretRf = new TextEncoder().encode(process.env.SECRET_RFTK);
    // Verify the refresh token
    const { payload } = await jwtVerify(refreshToken, secretRf);

    // Check on the DB, refresh token's availability
    const storedToken = await RefreshToken.findOne({ token: refreshToken });

    // If not available throw an error
    if (!storedToken) {
      return NextResponse.json(
        { message: "Invalid refresh token" },
        { status: 403 }
      );
    }

    // Extract the user from the payload
    const user = await User.findById(payload.userId);

    // If the user is not present throw an error
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Delete the old refresh token from the DB
    await RefreshToken.deleteOne({ token: refreshToken });

    // Generate the new DB
    const newRefreshToken = await new SignJWT({ userId: user._id.toString() })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("3m")
      .sign(secretRf);

    // Store the new refresh token in the DB
    await new RefreshToken({ userId: user._id, token: newRefreshToken }).save();

    // Generate new access token as well
    const secret = new TextEncoder().encode(process.env.SECRET_KEY);

    const newAccessToken = await new SignJWT({
      userId: user._id.toString(),
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1m")
      .sign(secret);

    // Return the new access token & the new refresh token
    return NextResponse.json(
      { accessToken: newAccessToken, refreshToken: newRefreshToken },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error : ", error.message);
    return NextResponse.json(
      { message: "Invalid or expired refresh token" },
      { status: 403 }
    );
  }
}
