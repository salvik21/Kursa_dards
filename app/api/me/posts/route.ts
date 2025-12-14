import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireSessionUser } from "@/lib/auth/server";
import { loadAllPhotosForPosts, loadVisiblePhotosForPosts } from "@/lib/postPhotos";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const snap = await adminDb
      .collection("posts")
      .where("userId", "==", user.uid)
      .limit(100)
      .get();

    const categoriesSnap = await adminDb.collection("categories").get();
    const categoriesMap = new Map<string, string>();
    categoriesSnap.docs.forEach((d) => categoriesMap.set(d.id, (d.data() as any)?.name ?? ""));

    // load photo visibility and place data
    const postIds = snap.docs
      .map((d) => (d.data() as any)?.id as string | undefined)
      .filter((id): id is string => Boolean(id));
    const photosMap = await loadAllPhotosForPosts(postIds);
    const placeMap = new Map<string, any>();
    await Promise.all(
      postIds.map(async (id) => {
        try {
          const doc = await adminDb.collection("postsPlace").doc(id).get();
          if (doc.exists) placeMap.set(id, doc.data());
        } catch {
          // ignore lookup issues
        }
      })
    );

    const posts = snap.docs
      .map((d) => {
        const data = d.data() as any;
        const id = data.id as string | undefined;
        if (!id) return null;
        const categoryName = categoriesMap.get(data.categoryId) ?? data.categoryName ?? data.category ?? "";
        const placeData = placeMap.get(id);
        const photoList = photosMap.get(id) ?? [];
        const hiddenPhotos = photoList.filter((p) => !p.visible).map((p) => p.url);
        const photos = photoList.map((p) => p.url);
        const photosHidden = photos.length > 0 && hiddenPhotos.length === photos.length;
        return {
          id,
          title: data.title ?? "",
          type: data.type ?? "",
          status: data.status ?? "open",
          category: categoryName,
          placeName: placeData?.placeNamePlace ?? data.placeName ?? null,
          description: data.descriptionPosts ?? data.description ?? "",
          photos,
          photosHidden,
          blockedReason: data.blockedReason ?? null,
          blockedAt: data.blockedAt?.toDate ? data.blockedAt.toDate().toISOString() : null,
          blockedBy: data.blockedBy ?? null,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
        };
      })
      .filter(Boolean) as any[];

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
