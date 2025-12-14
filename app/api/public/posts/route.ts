import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { loadVisiblePhotosForPosts } from "@/lib/postPhotos";

export const runtime = "nodejs";

function chunk<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
  return res;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim().toLowerCase() || "";
    const terms = q ? q.split(/\s+/).filter(Boolean) : [];
    const type = searchParams.get("type")?.trim().toLowerCase() || "";
    const category = searchParams.get("category")?.trim().toLowerCase() || "";
    const place = searchParams.get("place")?.trim().toLowerCase() || "";
    const tagQuery = searchParams.get("tag") || searchParams.get("tags") || "";
    const requestedTags = tagQuery
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const limit = q || type || category || place ? 50 : 20;

    const categoriesSnap = await adminDb.collection("categories").get();
    const categoriesMap = new Map<string, string>();
    categoriesSnap.docs.forEach((d) => categoriesMap.set(d.id, (d.data() as any)?.name ?? ""));

    const tagsSnap = await adminDb.collection("tags").get();
    const tagNameToId = new Map<string, string>();
    const tagIdToName = new Map<string, string>();
    tagsSnap.docs.forEach((d) => {
      const raw = d.data() as any;
      const name = (raw?.name ?? "").toLowerCase().trim();
      if (name) tagNameToId.set(name, d.id);
      tagIdToName.set(d.id, raw?.name ?? "");
    });
    const requestedTagIds = requestedTags
      .map((name) => tagNameToId.get(name) || name) // allow id or name
      .filter(Boolean);

    const snap = await adminDb
      .collection("posts")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const rawPosts = snap.docs
      .map((d) => {
        const data = d.data() as any;
        const postId = data.id;
        if (!postId) return null;
        const categoryName = categoriesMap.get(data.categoryId) ?? data.categoryName ?? data.category ?? "";
        return {
          id: postId,
          userId: data.userId ?? null,
          title: data.title ?? "",
          type: data.type ?? "",
          status: data.status ?? "open",
          category: categoryName,
          categoryName,
          categoryId: data.categoryId ?? "",
          placeName: data.placeName ?? null,
          description: data.descriptionPosts ?? data.description ?? "",
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
        };
      })
      .filter(Boolean) as any[];

    const ownerMap = new Map<string, string | undefined>();
    snap.docs.forEach((d) => {
      const data = d.data() as any;
      if (data?.id) ownerMap.set(data.id, data?.userId ?? undefined);
    });

    const photoMap = await loadVisiblePhotosForPosts(rawPosts.map((p) => p.id));

    // Load tags for these posts
    const postIds = rawPosts.map((p) => p.id);
    const postTagsMap = new Map<string, string[]>();
    for (const group of chunk(postIds, 10)) {
      const tagsSnapChunk = await adminDb.collection("postTags").where("postId", "in", group).get();
      tagsSnapChunk.docs.forEach((doc) => {
        const data = doc.data() as any;
        const list = postTagsMap.get(data.postId) ?? [];
        if (data.tagId) list.push(String(data.tagId));
        postTagsMap.set(data.postId, list);
      });
    }

    // Load place data per post (small per-doc fetch, limit <= 50)
    const placeMap = new Map<string, any>();
    await Promise.all(
      rawPosts.map(async (p) => {
        try {
          const doc = await adminDb.collection("postsPlace").doc(p.id).get();
          if (doc.exists) {
            placeMap.set(p.id, doc.data());
          }
        } catch {
          // ignore place fetch errors
        }
      })
    );

    const posts = rawPosts
      .map((p) => {
        const placeData = placeMap.get(p.id);
        // Prefer place name stored in postsPlace; fall back to post value if not set
        const placeName = placeData?.placeNamePlace ?? p.placeName ?? null;
        const photos = photoMap.get(p.id)?.map((ph) => ph.url) ?? [];
        const tagIds = postTagsMap.get(p.id) ?? [];
        const tagNames = tagIds.map((id) => tagIdToName.get(id) ?? id);
        return { ...p, photos, placeName, placeGeo: placeData?.geo ?? null, tagIds, tagNames };
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
        if (requestedTagIds.length) {
          const hasTag = p.tagIds?.some?.((t: string) => requestedTagIds.includes(t));
          if (!hasTag) return false;
        }
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
