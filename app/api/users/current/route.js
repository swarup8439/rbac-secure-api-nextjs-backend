import connectDB from "@/util/db";
import User from "@/util/User";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    await connectDB();

    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized request :( " },
        { status: 401 }
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { message: "User not found :( " },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        id: user._id,
        name: user.uname,
        email: user.email,
        password: user.password,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
