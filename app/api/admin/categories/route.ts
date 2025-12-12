import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/server";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  const snap = await adminDb.collection("categories").orderBy("name", "asc").get();
  const categories = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  return NextResponse.json({ ok: true, categories });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  try {
    const { name } = await req.json();
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ ok: false, error: "Name is required" }, { status: 400 });
    }
    const clean = name.trim();
    const docRef = adminDb.collection("categories").doc();
    await docRef.set({
      id: docRef.id,
      name: clean,
      createdAt: new Date(),
    });
    return NextResponse.json({ ok: true, id: docRef.id });
  } catch (error: any) {
    console.error("Create category error:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to create category" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  try {
    const { id } = await req.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
    }
    await adminDb.collection("categories").doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Delete category error:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to delete category" }, { status: 500 });
  }
}
