import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/server";
import { distanceKm } from "@/lib/geo";
import { buildPostUrl, sendEmail } from "@/lib/email";
import { upsertPostPlace } from "@/lib/postsPlace";
import { syncPostPhotos } from "@/lib/postPhotos";

export const runtime = "nodejs";
const ALLOWED_RADII = [0.5, 1, 2, 3, 4];

type GeoInput = { lat?: number; lng?: number };

async function getCategoryNameById(categoryId?: string | null) {
  if (!categoryId) return "";
  try {
    const snap = await adminDb.collection("categories").doc(categoryId).get();
    return (snap.data() as any)?.name ?? "";
  } catch {
    return "";
  }
}

function normalizeGeo(raw: GeoInput | null | undefined) {
  if (!raw || typeof raw !== "object") return null;
  const lat = Number((raw as any).lat);
  const lng = Number((raw as any).lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function normalizeVisibilityFlag(value: any, defaultValue: boolean) {
  if (typeof value === "boolean") return value;
  return defaultValue;
}

async function syncPostTags(postId: string, tags: string[]) {
  const cleanTags = Array.isArray(tags) ? tags.filter(Boolean) : [];
  const existing = await adminDb.collection("postTags").where("postId", "==", postId).get();
  const batch = adminDb.batch();

  // remove old
  existing.docs.forEach((doc) => batch.delete(doc.ref));

  // add new
  cleanTags.forEach((tagId) => {
    const ref = adminDb.collection("postTags").doc();
    batch.set(ref, {
      postId,
      tagId,
      createdAt: new Date(),
    });
  });

  await batch.commit();
}

async function sendNotificationsForPost(postId: string, post: any) {
  const geo = normalizeGeo(post.geo);
  if (!geo) {
    return;
  }

  const categoryName = await getCategoryNameById(post.categoryId);
  const postUrl = buildPostUrl(postId);

  let subsSnap;
  try {
    subsSnap = await adminDb.collection("subscriptions").where("enabled", "==", true).get();
  } catch (err) {
    // Fallback if some docs don't have the enabled field yet.
    subsSnap = await adminDb.collection("subscriptions").get();
  }

  const jobs = subsSnap.docs.map(async (docSnap) => {
    const data = docSnap.data() as any;
    const target = normalizeGeo(data.location?.geo);
    const radiusKm = Number(data.radiusKm);
    const to = data.userEmail || data.email;

    if (!to || !target || !ALLOWED_RADII.includes(radiusKm)) return;

    const dist = distanceKm(geo, target);
    if (dist > radiusKm) return;

    const subject = `New post near you: ${post.title ?? postId}`;
    const text = `A new announcement was published within ${radiusKm} km of your saved location.

Title: ${post.title ?? "Post"}
Category: ${categoryName}
Distance: ${dist.toFixed(2)} km
Link: ${postUrl}
`;

    await sendEmail({
      to,
      subject,
      text,
    });
  });

  await Promise.allSettled(jobs);
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const now = new Date();
    const categoryId = body.categoryId || body.category || null;

    const geo = normalizeGeo(body.geo);
    const showEmail = normalizeVisibilityFlag(body.showEmail, true);
    const showPhone = normalizeVisibilityFlag(body.showPhone, false);
    const privateNote = typeof body.privateNote === "string" ? body.privateNote.trim() : "";
    const descriptionPlace = typeof body.descriptionPlace === "string" ? body.descriptionPlace.trim() : null;
    const doc = {
      title: body.title,
      type: body.type,
      status: "pending",
      categoryId,
      tags: Array.isArray(body.tags) ? body.tags : [],
      placeName: null,
      postsPlaceId: null as string | null,
      descriptionPosts: body.description,
      descriptionHidden: false,
      foundNote: body.foundNote ?? null,
      photos: Array.isArray(body.photos) ? body.photos : [],
      userId: user.uid,
      showEmail,
      showPhone,
      privateNote,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await adminDb.collection("posts").add({ ...doc, postsPlaceId: null });

    // sync tags -> postTags collection
    await syncPostTags(ref.id, doc.tags);

    // Keep postsPlace in sync for mapping/location uses
    await upsertPostPlace({
      postId: ref.id,
      geo,
      description: descriptionPlace,
      placeName: null,
    });

    // store postsPlaceId now that doc exists
    await ref.update({ postsPlaceId: ref.id });

    await syncPostPhotos({
      postId: ref.id,
      photos: doc.photos,
    });

    // Notify subscribers about nearby posts (best-effort, non-blocking on failure)
    await sendNotificationsForPost(ref.id, { ...doc, geo });

    return NextResponse.json({ ok: true, id: ref.id });
  } catch (error: any) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to create post" },
      { status: 500 }
    );
  }
}
