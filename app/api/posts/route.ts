import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/server";
import { distanceKm } from "@/lib/geo";
import { buildPostUrl, sendEmail } from "@/lib/email";

export const runtime = "nodejs";
const ALLOWED_RADII = [0.5, 1, 2, 3, 4];

type GeoInput = { lat?: number; lng?: number };

function normalizeGeo(raw: GeoInput | null | undefined) {
  if (!raw || typeof raw !== "object") return null;
  const lat = Number((raw as any).lat);
  const lng = Number((raw as any).lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
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
Category: ${post.category ?? ""}
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

    const geo = normalizeGeo(body.geo);
    const doc = {
      title: body.title,
      type: body.type,
      status: "pending",
      category: body.category,
      tags: Array.isArray(body.tags) ? body.tags : [],
      placeName: body.placeName ?? null,
      geo,
      description: body.description,
      descriptionHidden: false,
      foundNote: body.foundNote ?? null,
      photos: Array.isArray(body.photos) ? body.photos : [],
      userId: user.uid,
      ownerEmail: user.email ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await adminDb.collection("posts").add(doc);

    // sync tags -> postTags collection
    await syncPostTags(ref.id, doc.tags);

    // Notify subscribers about nearby posts (best-effort, non-blocking on failure)
    await sendNotificationsForPost(ref.id, doc);

    return NextResponse.json({ ok: true, id: ref.id });
  } catch (error: any) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to create post" },
      { status: 500 }
    );
  }
}
