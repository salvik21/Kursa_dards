import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/server";
import { deletePostWithRelations } from "@/lib/deletePost";
import { upsertPostPlace } from "@/lib/postsPlace";
import { syncPostPhotos } from "@/lib/postPhotos";

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

    // Try to load geo from postsPlace
    let geoFromPlace: any = null;
    let descriptionPlaceFromPlace: string | null = null;
    try {
      const placeSnap = await adminDb.collection("postsPlace").doc(params.id).get();
      const placeData = placeSnap.data() as any;
      geoFromPlace = placeData?.geo ?? null;
      descriptionPlaceFromPlace = placeData?.descriptionPlace ?? null;
    } catch {
      geoFromPlace = null;
      descriptionPlaceFromPlace = null;
    }

    // Resolve category name from categories collection
    let categoryName = "";
    if (data?.categoryId) {
      try {
        const catSnap = await adminDb.collection("categories").doc(data.categoryId).get();
        categoryName = (catSnap.data() as any)?.name ?? "";
      } catch {
        categoryName = "";
      }
    }

    return NextResponse.json({
      ok: true,
      post: {
        id: snap.id,
        title: data.title ?? "",
        type: data.type ?? "",
        
        categoryId: data.categoryId,
  
      
   
      
        photos: data.photos ?? [],
      
     
        showEmail: data.showEmail !== false,
        showPhone: !!data.showPhone,
        privateNote: data.privateNote ?? "",
        postsPlaceId: data.postsPlaceId ?? params.id,
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
    const categoryId = normalizeString(payload.categoryId || payload.category);
    const placeName = normalizeString(payload.placeName) || null;
    const description = normalizeString(payload.description);
    const descriptionPlace = normalizeString(payload.descriptionPlace);
    const photos = Array.isArray(payload.photos) ? payload.photos.filter(Boolean) : [];
    const tags = Array.isArray(payload.tags) ? payload.tags.filter(Boolean) : [];
    const geo = normalizeGeo(payload.geo);
    const showEmail = typeof payload.showEmail === "boolean" ? payload.showEmail : true;
    const showPhone = typeof payload.showPhone === "boolean" ? payload.showPhone : false;
    const privateNote = typeof payload.privateNote === "string" ? payload.privateNote.trim() : "";

    if (!title || !categoryId || !description) {
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
      categoryId,
      placeNamePosts: null,
      descriptionPosts: description,
      photos,
      tags,
      postsPlaceId: params.id,
      showEmail,
      showPhone,
      privateNote,
      status: "pending",
      blockedReason: null,
      blockedBy: null,
      blockedAt: null,
      updatedAt: new Date(),
    });

    await syncPostTags(params.id, tags);

    // Keep postsPlace in sync for mapping/location uses
    await upsertPostPlace({
      postId: params.id,
      geo,
      description: descriptionPlace || null,
      placeName: null,
    });

    await syncPostPhotos({
      postId: params.id,
      photos,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Update post error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to update post" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
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

    await deletePostWithRelations(params.id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Delete post error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to delete post" },
      { status: 500 }
    );
  }
}
