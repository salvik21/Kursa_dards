import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/server";
import { buildPostUrl, sendEmail } from "@/lib/email";
import { distanceKm } from "@/lib/geo";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  const categoriesSnap = await adminDb.collection("categories").get();
  const categoriesMap = new Map<string, string>();
  categoriesSnap.docs.forEach((d) => categoriesMap.set(d.id, (d.data() as any)?.name ?? ""));

  const snap = await adminDb.collection("posts").orderBy("createdAt", "desc").limit(50).get();
  const posts = snap.docs.map((d) => {
    const data = d.data() as any;
    const categoryName = categoriesMap.get(data.categoryId) ?? data.categoryName ?? data.category ?? "";
    return {
      id: d.id,
      title: data.title ?? "",
      type: data.type ?? "",
      status: data.status ?? "open",
      category: categoryName,
      placeName: data.placeName ?? null,
      description: data.descriptionPosts ?? "",
      photos: data.photos ?? [],
      photosHidden: data.photosHidden === true,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
      blockedReason: data.blockedReason ?? null,
      blockedBy: data.blockedBy ?? null,
      blockedAt: data.blockedAt?.toDate ? data.blockedAt.toDate().toISOString() : null,
      privateNote: data.privateNote ?? null,
    };
  });

  // Map blockedBy UID -> email
  const blockedIds = Array.from(
    new Set(posts.map((p) => p.blockedBy).filter((v): v is string => !!v))
  );
  const blockedEmailMap = new Map<string, string>();
  if (blockedIds.length) {
    const lookups = blockedIds.map(async (uid) => {
      try {
        const doc = await adminDb.collection("users").doc(uid).get();
        const data = doc.data() as any;
        if (data?.email) blockedEmailMap.set(uid, data.email);
      } catch {
        // ignore lookup errors
      }
    });
    await Promise.all(lookups);
  }

  const postsWithEmail = posts.map((p) => ({
    ...p,
    blockedByEmail: p.blockedBy ? blockedEmailMap.get(p.blockedBy) ?? null : null,
  }));

  return NextResponse.json({ ok: true, posts: postsWithEmail });
}

const ALLOWED_RADII = [0.5, 1, 2, 3, 4];
type GeoInput = { lat?: number; lng?: number };

function normalizeGeo(raw: GeoInput | null | undefined) {
  if (!raw || typeof raw !== "object") return null;
  const lat = Number((raw as any).lat);
  const lng = Number((raw as any).lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

async function notifySubscriptions(postId: string, post: any) {
  const geo = normalizeGeo(post.geo);
  if (!geo) return;

  const categoryName =
    (post.categoryId &&
      (await adminDb.collection("categories").doc(post.categoryId).get()).data()?.name) ||
    post.categoryName ||
    post.category ||
    "";

  const postUrl = buildPostUrl(postId);
  let subsSnap;
  try {
    subsSnap = await adminDb.collection("subscriptions").where("enabled", "==", true).get();
  } catch {
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
    const text = `A new announcement is now published within ${radiusKm} km of your saved location.

Title: ${post.title ?? "Post"}
Category: ${categoryName}
Distance: ${dist.toFixed(2)} km
Link: ${postUrl}
`;
    await sendEmail({ to, subject, text });
  });
  await Promise.allSettled(jobs);
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  try {
    const { id, status, blockReason } = await req.json();
    if (!id || typeof id !== "string" || !status || typeof status !== "string") {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }
    if (!["pending", "open", "resolved", "hidden", "closed"].includes(status)) {
      return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 400 });
    }
    const postSnap = await adminDb.collection("posts").doc(id).get();
    if (!postSnap.exists) {
      return NextResponse.json({ ok: false, error: "Post not found" }, { status: 404 });
    }
    const postData = postSnap.data() as any;

    const update: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === "hidden") {
      if (!blockReason || typeof blockReason !== "string" || !blockReason.trim()) {
        return NextResponse.json(
          { ok: false, error: "Block reason is required when hiding a post" },
          { status: 400 }
        );
      }
      update.blockedReason = blockReason.trim();
      update.blockedBy = user.uid;
      update.blockedAt = new Date();
    }
    await adminDb.collection("posts").doc(id).update(update);

    if (status === "hidden") {
      // try to notify owner about blocking
      let to: string | null = null;
      if (postData?.userId) {
        try {
          const userSnap = await adminDb.collection("users").doc(postData.userId).get();
          const userData = userSnap.data() as any;
          if (userData?.email) {
            to = userData.email;
          }
        } catch (err) {
          // ignore lookup failure
        }
      }

      if (!to && postData?.userEmail) {
        to = postData.userEmail;
      }

      if (to) {
        const reason = (blockReason || "").trim();
        const title = postData?.title ?? id;
        const postUrl = buildPostUrl(id);
        const subject = `Your post was hidden by admin: ${title}`;
        const text = `Your post "${title}" was hidden by an administrator.

Reason: ${reason}
Link: ${postUrl}
`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0; padding: 16px; color: #1f2937; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="margin: 0 0 8px; font-size: 18px; color: #111827;">   </h2>
            <p style="margin: 0 0 12px; color: #374151;">${title}</p>
            <div style="margin: 0 0 12px; padding: 12px; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px;">
              <p style="margin: 0 0 6px; font-weight: 600; color: #111827;"></p>
              <p style="margin: 0; color: #1f2937; white-space: pre-wrap;">${reason}</p>
            </div>
            <a href="${postUrl}" style="display: inline-block; margin-top: 4px; padding: 10px 16px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
               
            </a>
          </div>
        `;
        try {
          await sendEmail({ to, subject, text, html });
        } catch (err) {
          console.error("Failed to send block notification", err);
        }
      }
    }

    if (status === "open" && postData?.status !== "open") {
      try {
        await notifySubscriptions(id, postData);
      } catch (err) {
        console.error("Failed to notify subscribers after approval", err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Update post error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to update post" },
      { status: 500 }
    );
  }
}
