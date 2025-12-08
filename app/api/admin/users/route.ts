import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/server";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const snap = await adminDb.collection("users").orderBy("createdAt", "desc").get();
  const users = snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      email: data.email ?? "",
      name: data.displayName ?? data.name ?? "",
      phone: data.phone ?? "",
      role: data.role ?? "user",
      blocked: !!data.blocked,
      canLogin: data.canLogin !== undefined ? !!data.canLogin : true,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
    };
  });

  return NextResponse.json({ ok: true, users });
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  try {
    const { id, blocked, role } = await req.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }
    if (blocked !== undefined && typeof blocked !== "boolean") {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }
    if (role !== undefined && role !== "admin" && role !== "user") {
      return NextResponse.json({ ok: false, error: "Invalid role" }, { status: 400 });
    }

    // If demoting from admin to user, ensure at least one admin remains
    if (role === "user") {
      const adminsSnap = await adminDb.collection("users").where("role", "==", "admin").get();
      const adminCount = adminsSnap.size;
      // if target user is admin and they are the last admin -> block change
      const targetIsAdmin = adminsSnap.docs.some((d) => d.id === id);
      if (targetIsAdmin && adminCount <= 1) {
        return NextResponse.json(
          { ok: false, error: "Cannot remove the last admin" },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (blocked !== undefined) updateData.blocked = blocked;
    if (role !== undefined) updateData.role = role;

    await adminDb.collection("users").doc(id).update(updateData);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to update user" }, { status: 500 });
  }
}
