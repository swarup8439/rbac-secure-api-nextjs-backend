import connectDB from "@/util/db";
import { jwtVerify } from "jose";
import User from "@/util/User";
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

    const user = await User.findById(payload.userId);

    if (!user) {
      return NextResponse.json(
        { message: "Admin not in the DB" },
        { status: 404 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { message: "Access denied : Admins only 😞" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { message: `Welcome Admin (${user.uname}), you have access to admin's page 😊` },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
