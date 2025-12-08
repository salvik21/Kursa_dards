import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const snap = await adminDb.collection("places").orderBy("name", "asc").get();
    const places = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    return NextResponse.json({ ok: true, places });
  } catch (error: any) {
    console.error("Public places error:", error);
    return NextResponse.json({ ok: false, error: "Failed to load places" }, { status: 500 });
  }
}
