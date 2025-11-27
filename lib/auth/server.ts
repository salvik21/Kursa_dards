import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export type SessionUser = {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  role?: "user" | "admin";
};

async function fetchUserRole(uid: string): Promise<SessionUser["role"]> {
  try {
    const snap = await adminDb.collection("users").doc(uid).get();
    if (!snap.exists) return undefined;
    return snap.get("role") ?? undefined;
  } catch (error) {
    console.error("Failed to load user role:", error);
    return undefined;
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
    const role = await fetchUserRole(decoded.uid);

    return {
      uid: decoded.uid,
      email: decoded.email,
      emailVerified: decoded.email_verified,
      role,
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
