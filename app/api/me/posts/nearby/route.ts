import { NextResponse } from "next/server";
import { FieldPath } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireSessionUser } from "@/lib/auth/server";
import { loadVisiblePhotosForPosts } from "@/lib/postPhotos";

export const runtime = "nodejs";

const ALLOWED_RADII = [0.5, 1, 2, 3, 4];
const MAX_POSTS_SCAN = 200;
const BATCH_READ = 10;

type LatLng = { lat: number; lng: number };

function distanceKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const sin1 = Math.sin(dLat / 2);
  const sin2 = Math.sin(dLon / 2);
  const h = sin1 * sin1 + Math.cos(lat1) * Math.cos(lat2) * sin2 * sin2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

function normalizeGeo(raw: any): LatLng | null {
  const lat = Number(raw?.lat);
  const lng = Number(raw?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export async function GET() {
  try {
    const user = await requireSessionUser();

    // load enabled subscriptions with location
    const subsSnap = await adminDb.collection("subscriptions").where("userId", "==", user.uid).get();
    const subs = subsSnap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .filter(
        (s) =>
          s.enabled &&
          ALLOWED_RADII.includes(Number(s.radiusKm)) &&
          normalizeGeo(s.location?.geo)
      )
      .map((s) => ({
        id: s.id,
        geo: normalizeGeo(s.location?.geo)!,
        radiusKm: Number(s.radiusKm),
      }));

    if (!subs.length) {
      return NextResponse.json({ ok: true, posts: [], reason: "no_subscriptions" });
    }

    // preload categories for names
    const categoriesSnap = await adminDb.collection("categories").get();
    const categoriesMap = new Map<string, string>();
    categoriesSnap.docs.forEach((d) => categoriesMap.set(d.id, (d.data() as any)?.name ?? ""));

    // load recent post locations
    const placesSnap = await adminDb
      .collection("postsPlace")
      .orderBy("createdAt", "desc")
      .limit(MAX_POSTS_SCAN)
      .get();

    const placeEntries = placesSnap.docs
      .map((d) => {
        const data = d.data() as any;
        const geo = normalizeGeo(data.geo);
        return { postId: d.id, geo, placeName: data.placeNamePlace ?? data.placeName ?? null, descriptionPlace: data.descriptionPlace ?? null };
      })
      .filter((p) => p.geo);

    if (!placeEntries.length) {
      return NextResponse.json({ ok: true, posts: [] });
    }

    // find ids within any subscription radius
    const within = placeEntries.filter((p) =>
      subs.some((s) => distanceKm(s.geo, p.geo!) <= s.radiusKm)
    );

    if (!within.length) {
      return NextResponse.json({ ok: true, posts: [] });
    }

    // fetch posts data in batches
    const ids = within.map((p) => p.postId);
    const posts: any[] = [];
    for (let i = 0; i < ids.length; i += BATCH_READ) {
      const batchIds = ids.slice(i, i + BATCH_READ);
      const snap = await adminDb
        .collection("posts")
        .where(FieldPath.documentId(), "in", batchIds)
        .get();
      snap.docs.forEach((d) => {
        const data = d.data() as any;
        const postId = data.id as string | undefined;
        if (!postId) return;
        posts.push({ id: postId, data });
      });
    }

    const photosMap = await loadVisiblePhotosForPosts(ids);

    const combined = posts
      .map((p) => {
        const data = p.data;
        const place = within.find((w) => w.postId === p.id);
        const categoryName =
          categoriesMap.get(data.categoryId) ?? data.categoryName ?? data.category ?? "";
        const photos = photosMap.get(p.id)?.map((ph) => ph.url) ?? [];
        return {
          id: p.id,
          title: data.title ?? "",
          type: data.type ?? "",
          status: data.status ?? "open",
          category: categoryName,
          placeName: place?.placeName ?? data.placeName ?? null,
          description: data.descriptionPosts ?? data.description ?? place?.descriptionPlace ?? "",
          photos,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
          distanceKm: place ? Math.round(distanceKm(subs[0].geo, place.geo!) * 100) / 100 : null,
        };
      })
      // only open/resolved
      .filter((p) => p.status === "open" || p.status === "resolved")
      // sort by createdAt desc
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    return NextResponse.json({ ok: true, posts: combined });
  } catch (error: any) {
    console.error("GET /api/me/posts/nearby error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load nearby posts" },
      { status: error?.message === "Unauthenticated" ? 401 : 500 }
    );
  }
}
