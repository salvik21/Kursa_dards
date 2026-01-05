import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/server";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const snap = await adminDb.collection("settings").doc("contact").get();
    const email = (snap.data() as any)?.email ?? "";
    return NextResponse.json({ ok: true, email });
  } catch (error: any) {
    console.error("Admin contact get error:", error);
    return NextResponse.json({ ok: false, error: "Neizdevas ieladet kontaktu" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!email) {
      return NextResponse.json({ ok: false, error: "E-pasts ir obligats" }, { status: 400 });
    }
    await adminDb.collection("settings").doc("contact").set({ email }, { merge: true });
    return NextResponse.json({ ok: true, email });
  } catch (error: any) {
    console.error("Admin contact update error:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Neizdevas atjauninat contact" }, { status: 500 });
  }
}
