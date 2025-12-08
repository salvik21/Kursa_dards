import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/server";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const snap = await adminDb.collection("tags").orderBy("name", "asc").get();
  const tags = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  return NextResponse.json({ ok: true, tags });
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
    const cleanName = name.trim();
    const ref = await adminDb.collection("tags").add({
      name: cleanName,
      createdAt: new Date(),
    });
    return NextResponse.json({ ok: true, id: ref.id });
  } catch (error: any) {
    console.error("Create tag error:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to create tag" }, { status: 500 });
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
    await adminDb.collection("tags").doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Delete tag error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to delete tag" },
      { status: 500 }
    );
  }
}
