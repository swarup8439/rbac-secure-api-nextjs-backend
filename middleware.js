import { NextResponse } from "next/server";
// import jwt from "jsonwebtoken"; // jwt.verify expects crypto module in nodejs runtime, which is not supported in the edge runtime of nextjs. This is the common issues when using libraries that rely on nodejs specific APIs in an environment that doesn't support them.

// To resolve this issue we can use a JWT library that is compatible with the edge runtime of nextjs. One such library is 'jose'
import { jwtVerify } from "jose";
import { JWTExpired, JWTInvalid } from "jose/dist/types/util/errors";
import InvalidAccessToken from "./util/InvalidAccessToken";

export async function middleware(request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json(
      { message: "Access token not found :( " },
      { status: 401 }
    );
  }

  try {
    const accessToken = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

      const isInvalid = await InvalidAccessToken.findOne({token:accessToken});

      if (isInvalid) {
        return NextResponse.json({ message: "Invalid access token" }, { status: 401 });
      }

    // verify the token using 'jwt'
    // const decodedAccessToken = jwt.verify(accessToken, process.env.SECRET_KEY);

    // verify the token using 'jose'
    const { payload } = await jwtVerify(
      accessToken,
      new TextEncoder().encode(process.env.SECRET_KEY)
    );

    const requestHeaders = new Headers(request.headers);

    // requestHeaders.set("x-user-id", decodedAccessToken.userId); // using 'jwt'

    requestHeaders.set("x-user-id", payload.userId); // using 'jose'
    requestHeaders.set("x-user-role", payload.role);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch (error) {
    if (error instanceof JWTExpired) {
      return NextResponse.json(
        { message: "Access token is expired" },
        { status: 401 }
      );
    } else if (error instanceof JWTInvalid) {
      return NextResponse.json(
        { message: "Access token is invalid" },
        { status: 401 }
      );
    } else {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  }
}

export const config = {
  matcher: ["/api/users/current", "/api/admin/:path*", "/api/moderator/:path*","/api/logout"],
};
