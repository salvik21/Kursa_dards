import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const snap = await adminDb.collection("tags").orderBy("name", "asc").get();
    const tags = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    return NextResponse.json({ ok: true, tags });
  } catch (error: any) {
    console.error("Public tags error:", error);
    return NextResponse.json({ ok: false, error: "Neizdevas ieladet birkas" }, { status: 500 });
  }
}
