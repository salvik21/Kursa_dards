import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireSessionUser } from "@/lib/auth/server";
import { deleteUserAccount } from "@/lib/deleteUser";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const snap = await adminDb.collection("users").doc(user.uid).get();
    const data = snap.data() as any;
    return NextResponse.json({
      ok: true,
      user: {
        id: user.uid,
        email: data?.email ?? user.email ?? "",
        name: data?.displayName ?? data?.name ?? "",
        phone: data?.phone ?? "",
        role: data?.role ?? user.role ?? "user",
      },
    });
  } catch (error: any) {
    console.error("GET /api/me error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load profile" },
      { status: error?.message === "Unauthenticated" ? 401 : 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireSessionUser();
    const { name, phone, email } = await req.json();
    const update: Record<string, any> = {
      updatedAt: new Date(),
    };
    if (name !== undefined) {
      if (name !== null && typeof name !== "string") {
        return NextResponse.json({ ok: false, error: "Invalid name" }, { status: 400 });
      }
      update.name = name?.trim?.() ?? "";
      update.displayName = update.name;
    }
    if (phone !== undefined) {
      if (phone !== null && typeof phone !== "string") {
        return NextResponse.json({ ok: false, error: "Invalid phone" }, { status: 400 });
      }
      update.phone = phone?.trim?.() ?? "";
    }
    if (email !== undefined) {
      if (email !== null && typeof email !== "string") {
        return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
      }
      update.email = email?.trim?.() ?? "";
    }

    await adminDb.collection("users").doc(user.uid).set(
      {
        email: update.email ?? user.email ?? "",
        ...update,
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("PATCH /api/me error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to update profile" },
      { status: error?.message === "Unauthenticated" ? 401 : 500 }
    );
  }
}

export async function DELETE() {
  try {
    const user = await requireSessionUser();
    await deleteUserAccount(user.uid, { protectLastAdmin: true });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE /api/me error:", error);
    const status =
      error?.message === "Unauthenticated"
        ? 401
        : error?.message === "Cannot delete the last admin"
          ? 400
          : 500;
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to delete account" },
      { status }
    );
  }
}
