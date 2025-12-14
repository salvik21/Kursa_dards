import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/server";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    const { reason, reporterName, reporterEmail } = await req.json();

    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return NextResponse.json(
        { ok: false, error: "Текст жалобы обязателен" },
        { status: 400 }
      );
    }

    const postSnap = await adminDb.collection("posts").doc(params.id).get();
    if (!postSnap.exists) {
      return NextResponse.json({ ok: false, error: "Объявление не найдено" }, { status: 404 });
    }
    const postData = postSnap.data() as any;

    const complaintRef = adminDb.collection("complaints").doc();
    await complaintRef.set({
      id: complaintRef.id,
      postId: params.id,
      userId: user?.uid ?? "0",
      reporterName: reporterName || null,
      reporterEmail: user?.email ?? reporterEmail ?? null,
      reason: reason.trim(),
      status: "accepted",
      postTitle: postData?.title ?? null,
      postStatus: postData?.status ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Create complaint error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Не удалось отправить жалобу" },
      { status: 500 }
    );
  }
}
