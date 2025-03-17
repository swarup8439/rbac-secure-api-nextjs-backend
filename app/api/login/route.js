import User from "@/util/User";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import RefreshToken from "@/util/RefreshToken";

// import jwt from "jsonwebtoken";
import { SignJWT } from "jose";

import connectDB from "@/util/db";

export async function POST(request) {
  await connectDB();

  const { email, password } = await request.json();

  if (!email || !password) {
    return new NextResponse(
      { message: "Please fill in all fields :( " },
      { status: 422 }
    );
  }

  const user = await User.findOne({ email });

  if (!user) {
    return new NextResponse(
      JSON.stringify({ message: "User doesn't exist :( " }),
      { status: 404 }
    );
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return new NextResponse(
      JSON.stringify({ message: "User doesn't exist :( " }),
      { status: 404 }
    );
  }

  // Generate a token using JWT
  // const accessToken = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
  //   subject: "accessAPI",
  //   expiresIn: "1h",
  // });

  // Generate access token using Jose which also uses JWT under the hood
  const secret = new TextEncoder().encode(process.env.SECRET_KEY); // Encode the secret

  const accessToken = await new SignJWT({ userId: user._id.toString() }) // Create a new JWT !Q& label it as userId
    .setProtectedHeader({ alg: "HS256" }) // Set the algorithm
    .setSubject("accessToken") // Set the subject
    .setExpirationTime("1m") // Set expiration time
    .sign(secret); // Sign the token

  // Generate a refresh token using Jose
  const secretRf = new TextEncoder().encode(process.env.SECRET_RFTK);

  const refreshToken = await new SignJWT({userId:user._id.toString() })
  .setProtectedHeader({alg:"HS256"})
  .setExpirationTime("3m")
  .setSubject("refreshToken")
  .sign(secretRf);

  await RefreshToken.deleteMany({ userId: user._id }); // Remove old refresh tokens
  await new RefreshToken({ userId: user._id, token: refreshToken }).save(); // Store the new refresh token

  return new NextResponse(
    JSON.stringify({
      id: user._id,
      name: user.uname,
      email: user.email,
      role: user.role,
      accessToken,
      refreshToken
    }),
    { status: 200 }
  );
}
