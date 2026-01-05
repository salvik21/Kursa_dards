import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const snap = await adminDb
      .collection("posts")
      .doc(params.id)
      .collection("messages")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();
    const messages = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        email: data.email ?? "",
        phone: data.phone ?? "",
        content: data.content ?? "",
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
      };
    });
    return NextResponse.json({ ok: true, messages });
  } catch (error: any) {
    console.error("Load messages error:", error);
    return NextResponse.json({ ok: false, error: "Neizdevas ieladet zinas" }, { status: 500 });
  }
}
