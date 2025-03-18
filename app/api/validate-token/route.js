import { NextResponse } from "next/server";
import InvalidAccessToken from "@/util/InvalidAccessToken";
import connectDB from "@/util/db";

export async function GET(request) {
  await connectDB();

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ message: "Access token required" }, { status: 401 });
  }

  const accessToken = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  const isInvalid = await InvalidAccessToken.findOne({ token: accessToken });

  return NextResponse.json({ invalid: !!isInvalid });
}
