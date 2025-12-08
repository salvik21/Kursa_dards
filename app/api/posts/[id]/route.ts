import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/server";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["lost", "found"];

function normalizeString(value: any) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeGeo(raw: any) {
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
  existing.docs.forEach((doc) => batch.delete(doc.ref));
  cleanTags.forEach((tagId) => {
    const ref = adminDb.collection("postTags").doc();
    batch.set(ref, { postId, tagId, createdAt: new Date() });
  });
  await batch.commit();
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const snap = await adminDb.collection("posts").doc(params.id).get();
    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const data = snap.data() as any;
    const isOwner = data?.userId === user.uid;
    const isAdmin = user.role === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      post: {
        id: snap.id,
        title: data.title ?? "",
        type: data.type ?? "",
        category: data.category ?? "",
      placeName: data.placeName ?? null,
      description: data.description ?? "",
      photos: data.photos ?? [],
      geo: data.geo ?? null,
    },
  });
} catch (error: any) {
  console.error("Get post error:", error);
  return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load post" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const snap = await adminDb.collection("posts").doc(params.id).get();
    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    const data = snap.data() as any;

    const isOwner = data?.userId === user.uid;
    const isAdmin = user.role === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const payload = await req.json();
    const title = normalizeString(payload.title);
    const type = normalizeString(payload.type).toLowerCase();
    const category = normalizeString(payload.category);
    const placeName = normalizeString(payload.placeName) || null;
    const description = normalizeString(payload.description);
    const photos = Array.isArray(payload.photos) ? payload.photos.filter(Boolean) : [];
    const tags = Array.isArray(payload.tags) ? payload.tags.filter(Boolean) : [];
    const geo = normalizeGeo(payload.geo);

    if (!title || !category || !description) {
      return NextResponse.json(
        { ok: false, error: "Title, category and description are required" },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ ok: false, error: "Invalid type" }, { status: 400 });
    }

    await adminDb.collection("posts").doc(params.id).update({
      title,
      type,
      category,
      placeName,
      description,
      photos,
      tags,
      geo: geo ?? null,
      updatedAt: new Date(),
    });

    await syncPostTags(params.id, tags);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Update post error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to update post" },
      { status: 500 }
    );
  }
}
