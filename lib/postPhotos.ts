import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebase/admin";

type UpsertPayload = {
  postId: string;
  photos?: string[] | null;
};

export async function syncPostPhotos({ postId, photos }: UpsertPayload) {
  const urls = Array.isArray(photos) ? photos.filter(Boolean) : [];
  const ref = adminDb.collection("postPhotos").doc(postId);

  if (!urls.length) {
    await ref.delete();
    return;
  }

  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const createdAt = snap.exists ? snap.get("createdAt") ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp();
    tx.set(
      ref,
      {
        postId,
        photos: urls,
        createdAt,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}

export async function deletePostPhotos(postId: string) {
  await adminDb.collection("postPhotos").doc(postId).delete();
}
