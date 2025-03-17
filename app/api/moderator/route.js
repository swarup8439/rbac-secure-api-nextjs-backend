import connectDB from "@/util/db";
import User from "@/util/User";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    await connectDB();

    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { message: "Unauthorized request :( " },
        { status: 401 }
      );
    }

    const accessToken = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    const { payload } = await jwtVerify(
      accessToken,
      new TextEncoder().encode(process.env.SECRET_KEY)
    );

    // As payload only contains the user's id, we need to fetch the user's data from the database
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { message: "Moderator not found in the DB" },
        { status: 404 }
      );
    }

    if (!(user.role === "admin" || user.role === "moderator")) {
      return NextResponse.json(
        { message: "Access denied : Admins & Moderators only 😞" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        message: `Welcome ${user.role}, you have access to moderator's page 😊`,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
