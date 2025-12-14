import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebase/admin";

type UpsertPayload = {
  postId: string;
  photo?: string | null;
  hidden?: boolean;
};

type LoadedPhoto = { url: string; visible: boolean };

function chunk<T>(list: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < list.length; i += size) {
    result.push(list.slice(i, i + size));
  }
  return result;
}

function buildPhotoId(url: string) {
  // Deterministic id per URL.
  return Buffer.from(url).toString("base64").replace(/[+/=]/g, "").slice(0, 140);
}

export async function syncPostPhotos({ postId, photo, hidden }: UpsertPayload) {
  const list = Array.isArray(photo) ? photo : [photo];
  const urls = list.map((u) => (typeof u === "string" ? u.trim() : "")).filter(Boolean);

  // If no photo provided, remove all records for this post.
  if (!urls.length) {
    await deletePostPhotos(postId);
    return;
  }

  const now = FieldValue.serverTimestamp();
  const batch = adminDb.batch();

  urls.forEach((url) => {
    const id = buildPhotoId(url);
    const ref = adminDb.collection("postPhotos").doc(id);
    batch.set(
      ref,
      {
        id,
        postId,
        url,
        visible: hidden !== true,
        hidden: hidden === true,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
  });

  await batch.commit();
}

export async function deletePostPhotos(postId: string) {
  const snap = await adminDb.collection("postPhotos").where("postId", "==", postId).get();
  if (snap.empty) return;
  const batch = adminDb.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

export async function loadPhotosForPosts(postIds: string[], opts?: LoadPhotosOpts) {
  const ids = Array.from(new Set(postIds.filter(Boolean)));
  const map = new Map<string, LoadedPhoto[]>();

  for (const group of chunk(ids, 10)) {
    const snap = await adminDb.collection("postPhotos").where("postId", "in", group).get();
    snap.docs.forEach((doc) => {
      const data = doc.data() as any;
      const url = data.url ?? data.photoUrl;
      if (!url) return;
      const visible = data.visible !== false;
      const arr = map.get(data.postId) ?? [];
      arr.push({ url, visible });
      map.set(data.postId, arr);
    });
  }

  return map;
}

export async function loadAllPhotosForPosts(postIds: string[]) {
  return loadPhotosForPosts(postIds);
}

export async function loadVisiblePhotosForPosts(postIds: string[]) {
  const ids = Array.from(new Set(postIds.filter(Boolean)));
  const map = new Map<string, LoadedPhoto[]>();

  for (const group of chunk(ids, 10)) {
    const snap = await adminDb.collection("postPhotos").where("postId", "in", group).get();
    snap.docs.forEach((doc) => {
      const data = doc.data() as any;
      const url = data.url ?? data.photoUrl;
      if (!url) return;
      const visible = data.visible !== false;
      if (!visible) return;
      const arr = map.get(data.postId) ?? [];
      arr.push({ url, visible });
      map.set(data.postId, arr);
    });
  }

  return map;
}
