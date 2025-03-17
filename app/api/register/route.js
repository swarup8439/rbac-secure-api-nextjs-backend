import connectDB from "@/util/db";
import User from "@/util/User";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request) {
  let { uname, email, password, role } = await request.json();

  if (!uname || !email || !password) {
    return new Response("Please fill all fields", { status: 422 });
  }

  await connectDB();

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return new NextResponse(
      JSON.stringify({ Error: "User already exists :( " }),
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    uname,
    email,
    password: hashedPassword,
    role: role || "member",
  });

  try {
    await newUser.save();
    return new NextResponse(
      JSON.stringify({ message: "User created successfully", id: newUser._id }),
      { status: 201 }
    );
  } catch (error) {
    return new Response("Internal ServerError", { status: 500 });
  }
}
