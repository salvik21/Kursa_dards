import { NextRequest, NextResponse } from "next/server";

// Edge middleware cannot use firebase-admin (node-only). Route-level guards handle auth.
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/me/:path*", "/posts/:path*/edit", "/admin/:path*"],
};
