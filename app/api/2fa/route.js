import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { authenticator } from "otplib";
import qrcode from "qrcode";
import connectDB from "@/util/db";
import User from "@/util/User";

export async function GET(request) {
  await connectDB();
  try {
    // Get Authorization Header
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { message: "Unauthorized request :( " },
        { status: 401 }
      );
    }

    // Extract Access Token
    const accessToken = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    // Verify JWT Token
    const { payload } = await jwtVerify(
      accessToken,
      new TextEncoder().encode(process.env.SECRET_KEY)
    );

    // Find User
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Ensure user email exists
    if (!user.email) {
      return NextResponse.json(
        { message: "User email is missing" },
        { status: 400 }
      );
    }

    // Generate New 2FA Secret
    const secret = authenticator.generateSecret();
    const uri = authenticator.keyuri(user.email, "MyAuthenticatorApp", secret);

    // Validate URI before generating QR Code
    if (!uri || typeof uri !== "string") {
      return NextResponse.json(
        { message: "Failed to generate 2FA URI" },
        { status: 500 }
      );
    }

    // Store 2FA Secret in Database
    await User.updateOne(
      { _id: payload.userId },
      { $set: { twoFASecret: secret, twoFAEnable: true } }
    );

    // Generate QR Code
    const qrCodeBuffer = await qrcode.toBuffer(uri);
    const finalBuffer = Buffer.from(qrCodeBuffer);

    // ✅ Return QR Code Image
    return new Response(finalBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("2FA Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// TOTP - Time-based One Time Password

// Handle TOTP Verification Request
export async function POST(request) {
  await connectDB();
  try {
    const { totp } = await request.json();

    if (!totp) {
      return NextResponse.json({ message: "TOTP is missing" }, { status: 400 });
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { message: "Unauthorized request :( " },
        { status: 401 }
      );
    }

    // Extract Access Token
    const accessToken = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    // Verify JWT Token
    const { payload } = await jwtVerify(
      accessToken,
      new TextEncoder().encode(process.env.SECRET_KEY)
    );

    // Find User
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const verified = authenticator.check(totp, user.twoFASecret);

    if (!verified) {
      return NextResponse.json({ message: "Invalid TOTP" }, { status: 401 });
    }

    await User.updateOne(
      { _id: payload.userId },
      { $set: { twoFAEnable: true } }
    );

    return NextResponse.json(
      { message: "TOTP verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Error verifying TOTP" },
      { status: 500 }
    );
  }
}
