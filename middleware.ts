import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

const protectedMatchers = [/^\/me\//, /^\/posts\/.+\/edit$/, /^\/admin\//];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const requiresAuth = protectedMatchers.some((pattern) =>
    pattern.test(pathname)
  );
  if (!requiresAuth) {
    return NextResponse.next();
  }

  const token = req.cookies.get("session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/auth/sign-in", req.url));
  }

  try {
    await adminAuth.verifySessionCookie(token, true);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/auth/sign-in", req.url));
  }
}

export const config = {
  matcher: ["/me/:path*", "/posts/:path*/edit", "/admin/:path*"],
};
