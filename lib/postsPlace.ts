import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebase/admin";

type GeoPoint = { lat: number; lng: number } | null | undefined;

function normalizeGeo(geo: GeoPoint) {
  if (!geo || typeof geo !== "object") return null;
  const lat = Number((geo as any).lat);
  const lng = Number((geo as any).lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

type UpsertPayload = {
  postId: string;
  geo?: GeoPoint;
  description?: string | null;
  placeName?: string | null;
};

export async function upsertPostPlace(payload: UpsertPayload) {
  const geo = normalizeGeo(payload.geo);
  const ref = adminDb.collection("postsPlace").doc(payload.postId);

  // Only keep entries that have valid coordinates; otherwise remove the mapping.
  if (!geo) {
    await ref.delete();
    return;
  }

  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const createdAt = snap.exists
      ? snap.get("createdAt") ?? FieldValue.serverTimestamp()
      : FieldValue.serverTimestamp();

    tx.set(
      ref,
      {
        id: payload.postId,
        postId: payload.postId,
        geo,
        descriptionPlace: payload.description ?? null,
        placeNamePlace: payload.placeName ?? null,
        createdAt,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}

export async function deletePostPlace(postId: string) {
  await adminDb.collection("postsPlace").doc(postId).delete();
}
