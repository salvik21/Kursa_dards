import "server-only";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export type SessionUser = {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  role?: "user" | "admin";
  blocked?: boolean;
  canLogin?: boolean;
};

async function fetchUserMeta(uid: string): Promise<Pick<SessionUser, "role" | "blocked" | "canLogin">> {
  try {
    const snap = await adminDb.collection("users").doc(uid).get();
    if (!snap.exists) return {};
    const data = snap.data() as any;
    return {
      role: data?.role ?? undefined,
      blocked: data?.blocked === true,
      canLogin: data?.canLogin !== false,
    };
  } catch (error) {
    console.error("Failed to load user meta:", error);
    return {};
  }
}

export async function getSessionUser(required = false): Promise<SessionUser | null> {
  const token = cookies().get("session")?.value;
  if (!token) {
    if (required) {
      throw new Error("Unauthenticated");
    }
    return null;
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(token, true);
    const meta = await fetchUserMeta(decoded.uid);

    if (meta.blocked || meta.canLogin === false) {
      if (required) {
        throw new Error("Blocked");
      }
      return null;
    }

    return {
      uid: decoded.uid,
      email: decoded.email,
      emailVerified: decoded.email_verified,
      ...meta,
    };
  } catch (error) {
    if (required) {
      throw new Error("Unauthenticated");
    }
    return null;
  }
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser(true);
  if (!user) {
    throw new Error("Unauthenticated");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireSessionUser();
  if (user.role !== "admin") {
    throw new Error("Forbidden");
  }
  return user;
}
