import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireSessionUser } from "@/lib/auth/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const snap = await adminDb
      .collection("posts")
      .where("userId", "==", user.uid)
      .limit(100)
      .get();

    const posts = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        title: data.title ?? "",
        type: data.type ?? "",
        status: data.status ?? "open",
        category: data.category ?? "",
        placeName: data.placeName ?? null,
        description: data.description ?? "",
        photos: data.photos ?? [],
        blockedReason: data.blockedReason ?? null,
        blockedAt: data.blockedAt?.toDate ? data.blockedAt.toDate().toISOString() : null,
        blockedBy: data.blockedBy ?? null,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
      };
    });

    // Sort client-side to avoid Firestore composite index requirement
    posts.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    return NextResponse.json({ ok: true, posts });
  } catch (error: any) {
    console.error("GET /api/me/posts error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load posts" },
      { status: error?.message === "Unauthenticated" ? 401 : 500 }
    );
  }
}
