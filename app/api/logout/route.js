import { NextResponse } from "next/server";
import InvalidAccessToken from "@/util/InvalidAccessToken";
import { jwtVerify } from "jose";
import connectDB from "@/util/db";

export async function POST(request) {
  await connectDB();

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json(
      { message: "Access token required" },
      { status: 401 }
    );
  }

  const accessToken = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    const { payload } = await jwtVerify(
      accessToken,
      new TextEncoder().encode(process.env.SECRET_KEY)
    );

    // ✅ Check if token is already invalid
    const isInvalid = await InvalidAccessToken.findOne({ token: accessToken });
    if (isInvalid) {
      return NextResponse.json(
        { message: "Token already invalid" },
        { status: 401 }
      );
    }

    // ✅ Store invalid token in DB
    await InvalidAccessToken.create({ token: accessToken });

    return NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Invalid access token" },
      { status: 403 }
    );
  }
}
