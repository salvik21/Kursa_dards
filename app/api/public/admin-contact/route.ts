import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const snap = await adminDb.collection("settings").doc("contact").get();
    const email = (snap.data() as any)?.email ?? "";
    return NextResponse.json({ ok: true, email });
  } catch (error: any) {
    console.error("Public admin contact error:", error);
    return NextResponse.json({ ok: false, error: "Failed to load contact" }, { status: 500 });
  }
}
