import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/server";
import { deletePostWithRelations } from "@/lib/deletePost";
import { upsertPostPlace } from "@/lib/postsPlace";
import { loadAllPhotosForPosts, loadVisiblePhotosForPosts, syncPostPhotos, deletePostPhotos } from "@/lib/postPhotos";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["lost", "found"];

function chunk<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
  return res;
}

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

async function ensureTag(tagRaw: string) {
  const name = (tagRaw || "").trim();
  if (!name) return null;
  const token = name.toLowerCase();

  let snap = await adminDb.collection("tags").where("nameLower", "==", token).limit(1).get();
  if (!snap.empty) {
    const doc = snap.docs[0];
    await doc.ref.set({ id: doc.id, name, nameLower: token }, { merge: true });
    return { id: doc.id, name };
  }

  snap = await adminDb.collection("tags").where("name", "==", name).limit(1).get();
  if (!snap.empty) {
    const doc = snap.docs[0];
    await doc.ref.set({ id: doc.id, name, nameLower: token }, { merge: true });
    return { id: doc.id, name };
  }

  const ref = await adminDb.collection("tags").add({
    name,
    nameLower: token,
    createdAt: new Date(),
  });
  await ref.set({ id: ref.id }, { merge: true });
  return { id: ref.id, name };
}

async function syncPostTags(postId: string, tags: string[]) {
  const cleanTags = Array.isArray(tags) ? tags.filter(Boolean) : [];
  const existing = await adminDb.collection("postTags").where("postId", "==", postId).get();
  const batch = adminDb.batch();
  existing.docs.forEach((doc) => batch.delete(doc.ref));

  for (const tagRaw of cleanTags) {
    const tag = await ensureTag(tagRaw);
    if (!tag) continue;
    const ref = adminDb.collection("postTags").doc();
    batch.set(ref, { postId, tagId: tag.id, createdAt: new Date() });
  }
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
    let placeNameFromPlace: string | null = null;
    try {
      const placeSnap = await adminDb.collection("postsPlace").doc(params.id).get();
      const placeData = placeSnap.data() as any;
      geoFromPlace = placeData?.geo ?? null;
      descriptionPlaceFromPlace = placeData?.descriptionPlace ?? null;
      placeNameFromPlace = placeData?.placeNamePlace ?? null;
    } catch {
      geoFromPlace = null;
      descriptionPlaceFromPlace = null;
      placeNameFromPlace = null;
    }

    const isOwner = data?.userId === user.uid;
    const photosMap = isOwner || isAdmin
      ? await loadAllPhotosForPosts([params.id])
      : await loadVisiblePhotosForPosts([params.id]);
    const photoList = photosMap.get(params.id) ?? [];
    const photos = photoList.map((p) => p.url);
    const hiddenPhotos = photoList.filter((p) => !p.visible).map((p) => p.url);
    const photosHidden = photos.length > 0 && hiddenPhotos.length === photos.length;

    // load tag ids for the post
    let tagIds: string[] = [];
    let tagNames: string[] = [];
    try {
      const tagsSnap = await adminDb.collection("postTags").where("postId", "==", params.id).get();
      tagIds = tagsSnap.docs.map((d) => (d.data() as any)?.tagId).filter(Boolean);
      if (tagIds.length) {
        const tagDocs = await adminDb.getAll(...tagIds.map((tid) => adminDb.collection("tags").doc(tid)));
        tagNames = tagDocs.map((doc) => ((doc.data() as any)?.name ?? "") as string).filter(Boolean);
      }
      if (!tagNames.length) {
        tagNames = tagIds;
      }
    } catch {
      tagIds = [];
      tagNames = [];
    }

    return NextResponse.json({
      ok: true,
      post: {
        id: snap.id,
        title: data.title ?? "",
        type: data.type ?? "",
        categoryId: data.categoryId,
        description: data.descriptionPosts ?? data.description ?? "",
        photos,
        photosHidden,
        hiddenPhotos,
        showEmail: data.showEmail !== false,
        showPhone: !!data.showPhone,
        privateNote: data.privateNote ?? "",
        placeName: placeNameFromPlace ?? null,
        descriptionPlace: descriptionPlaceFromPlace ?? null,
        geo: geoFromPlace,
        tags: tagIds,
        tagNames,
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
    const rawPhotos = Array.isArray(payload.photos) ? payload.photos.filter(Boolean) : [];
    const tags = Array.isArray(payload.tags) ? payload.tags.filter(Boolean) : [];
    const geo = normalizeGeo(payload.geo);
    const showEmail = typeof payload.showEmail === "boolean" ? payload.showEmail : true;
    const showPhone = typeof payload.showPhone === "boolean" ? payload.showPhone : false;
    const photosHidden = payload.photosHidden === true || payload.hidePhotos === true || payload.photoHidden === true;
    const hiddenPhotos = Array.isArray(payload.hiddenPhotos) ? payload.hiddenPhotos.filter(Boolean) : [];
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
      descriptionPosts: description,
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
      placeName: placeName || null,
    });

    // Replace photos: clear previous and add each URL separately to allow mixed visibility.
    await deletePostPhotos(params.id);
    for (const url of rawPhotos) {
      const isHidden = photosHidden || hiddenPhotos.includes(url);
      await syncPostPhotos({
        postId: params.id,
        photo: url,
        hidden: isHidden,
      });
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
