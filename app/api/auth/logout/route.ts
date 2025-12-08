import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function POST() {
  try {
    const token = cookies().get("session")?.value;
    if (token) {
      const decoded = await adminAuth.verifySessionCookie(token, true);
      await adminAuth.revokeRefreshTokens(decoded.sub);
    }
  } catch (error) {
    console.error("LOGOUT revoke error:", error);
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: "session",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
