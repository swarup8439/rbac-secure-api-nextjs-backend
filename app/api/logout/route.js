import connectDB from "@/util/db";
import { NextResponse } from "next/server";
import InvalidAccessToken from "@/util/InvalidAccessToken";

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
    await new InvalidAccessToken({ token: accessToken }).save();

    return NextResponse.json(
      { message: "Logged out successfully !" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: `Logout failed ${error.message}` },
      { status: 401 }
    );
  }
}
