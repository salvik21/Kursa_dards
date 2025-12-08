import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/server";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  const snap = await adminDb.collection("places").orderBy("name", "asc").get();
  const places = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  return NextResponse.json({ ok: true, places });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  try {
    const { name, lat, lng } = await req.json();
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ ok: false, error: "Name is required" }, { status: 400 });
    }
    if (typeof lat !== "number" || typeof lng !== "number" || Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json({ ok: false, error: "Valid lat/lng required" }, { status: 400 });
    }
    const clean = name.trim();
    const ref = await adminDb.collection("places").add({
      name: clean,
      lat,
      lng,
      createdAt: new Date(),
    });
    return NextResponse.json({ ok: true, id: ref.id });
  } catch (error: any) {
    console.error("Create place error:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to create place" }, { status: 500 });
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
    await adminDb.collection("places").doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Delete place error:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to delete place" }, { status: 500 });
  }
}
