import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

const SESSION_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { ok: false, error: "Missing idToken" },
        { status: 400 }
      );
    }

    const decoded = await adminAuth.verifyIdToken(idToken, true);

    const userRef = adminDb.collection("users").doc(decoded.uid);
    const snap = await userRef.get();
    if (!snap.exists) {
      await userRef.set({
        email: decoded.email ?? "",
        displayName: decoded.name ?? "",
        role: "user",
        emailVerified: decoded.email_verified ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_IN,
    });

    const response = NextResponse.json({ ok: true });

    response.cookies.set({
      name: "session",
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_EXPIRES_IN / 1000,
    });

    return response;
  } catch (error: any) {
    console.error("SESSION error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Unauthorized" },
      { status: 401 }
    );
  }
}
