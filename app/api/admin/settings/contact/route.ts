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
    return NextResponse.json({ ok: false, error: "Failed to load contact" }, { status: 500 });
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
      return NextResponse.json({ ok: false, error: "Email is required" }, { status: 400 });
    }
    await adminDb.collection("settings").doc("contact").set({ email }, { merge: true });
    return NextResponse.json({ ok: true, email });
  } catch (error: any) {
    console.error("Admin contact update error:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to update contact" }, { status: 500 });
  }
}
