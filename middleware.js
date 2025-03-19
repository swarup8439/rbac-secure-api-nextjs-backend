import { NextResponse } from "next/server";
// import jwt from "jsonwebtoken"; // jwt.verify expects crypto module in nodejs runtime, which is not supported in the edge runtime of nextjs. This is the common issues when using libraries that rely on nodejs specific APIs in an environment that doesn't support them.

// To resolve this issue we can use a JWT library that is compatible with the edge runtime of nextjs. One such library is 'jose'
import { jwtVerify } from "jose";

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
    
    // Get the whole URL & replace it with the new URL route
    const validateTokenUrl = new URL("/api/validate-token", request.url);

    // Using the new URL fetch data from the URL which is an object by using the token extracted from the header
    const validateResponse = await fetch(validateTokenUrl, {
      headers: { authorization: `${accessToken}` },
    });
  
    // Get the response from the URL (which is either true or false)
    const validateData = await validateResponse.json();
    if (validateData.invalid) {
      return NextResponse.json({ message: "Access token is revoked" }, { status: 401 });
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
    if (error.message.includes("JWTExpired")) {
      return NextResponse.json(
        { message: "Access token is expired" },
        { status: 401 }
      );
    } else if (error.message.includes("JWTInvalid")) {
      return NextResponse.json(
        { message: "Access token is invalid" },
        { status: 401 }
      );
    } else {
      console.log(error)
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  }
}

export const config = {
  matcher: [
    "/api/users/current",
    "/api/admin/:path*",
    "/api/moderator/:path*",
    "/api/2fa"
  ],
};
