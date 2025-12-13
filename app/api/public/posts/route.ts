import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim().toLowerCase() || "";
    const terms = q ? q.split(/\s+/).filter(Boolean) : [];
    const type = searchParams.get("type")?.trim().toLowerCase() || "";
    const category = searchParams.get("category")?.trim().toLowerCase() || "";
    const place = searchParams.get("place")?.trim().toLowerCase() || "";
    const limit = q || type || category || place ? 50 : 20;

    const categoriesSnap = await adminDb.collection("categories").get();
    const categoriesMap = new Map<string, string>();
    categoriesSnap.docs.forEach((d) => categoriesMap.set(d.id, (d.data() as any)?.name ?? ""));

    const snap = await adminDb
      .collection("posts")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const rawPosts = snap.docs
      .map((d) => {
        const data = d.data() as any;
        const categoryName = categoriesMap.get(data.categoryId) ?? data.categoryName ?? data.category ?? "";
        const postsPlaceId = data.postsPlaceId || d.id;
        return {
          id: d.id,
          title: data.title ?? "",
          type: data.type ?? "",
          status: data.status ?? "open",
          category: categoryName,
          categoryName,
          categoryId: data.categoryId ?? "",
          placeName: data.placeName ?? null,
          postsPlaceId,
          description: data.descriptionPosts ?? data.description ?? "",
          photos: data.photos ?? [],
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
        };
      });

    // Load place data per post (small per-doc fetch, limit <= 50)
    const placeMap = new Map<string, any>();
    await Promise.all(
      rawPosts.map(async (p) => {
        const placeId = p.postsPlaceId || p.id;
        if (!placeId) return;
        try {
          const doc = await adminDb.collection("postsPlace").doc(placeId).get();
          if (doc.exists) {
            placeMap.set(placeId, doc.data());
          }
        } catch {
          // ignore place fetch errors
        }
      })
    );

    const posts = rawPosts
      .map((p) => {
        const placeData = p.postsPlaceId ? placeMap.get(p.postsPlaceId) : null;
        // Prefer place name stored in postsPlace; fall back to post value if not set
        const placeName = placeData?.placeNamePlace ?? p.placeName ?? null;
        return { ...p, placeName, placeGeo: placeData?.geo ?? null };
      })
      // Only show approved posts
      .filter((p) => p.status === "open" || p.status === "resolved")
      // Apply filters
      .filter((p) => {
        if (type && p.type.toLowerCase() !== type) return false;
        if (
          category &&
          p.category.toLowerCase() !== category &&
          p.categoryId.toLowerCase() !== category
        )
          return false;
        const placeNameLower = (p.placeName ?? "").toLowerCase().trim();
        if (place && placeNameLower !== place) return false;
        if (!terms.length) return true;
        const haystack = `${p.title} ${p.description ?? ""} ${p.category ?? ""} ${p.placeName ?? ""}`
          .toLowerCase()
          .replace(/\s+/g, " ");
        return terms.every((term) => haystack.includes(term));
      });

    return NextResponse.json({ ok: true, posts, query: q });
  } catch (error: any) {
    console.error("Public posts error:", error);
    return NextResponse.json({ ok: false, error: "Failed to load posts" }, { status: 500 });
  }
}
