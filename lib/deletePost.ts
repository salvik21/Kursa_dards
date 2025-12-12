import type { DocumentReference, Query } from "firebase-admin/firestore";
import { adminDb } from "./firebase/admin";
import { deletePostPlace } from "./postsPlace";
import { deletePostPhotos } from "./postPhotos";

const BATCH_LIMIT = 400;

async function deleteQuery(query: Query) {
  // Delete in small batches to respect Firestore limits.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const snap = await query.limit(BATCH_LIMIT).get();
    if (snap.empty) break;
    const batch = adminDb.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    if (snap.size < BATCH_LIMIT) break;
  }
}

async function deleteSubcollection(docRef: DocumentReference, subcollection: string) {
  const query = docRef.collection(subcollection);
  await deleteQuery(query);
}

export async function deletePostWithRelations(postId: string) {
  const ref = adminDb.collection("posts").doc(postId);
  const snap = await ref.get();
  if (!snap.exists) {
    return { ok: false, reason: "not_found" as const };
  }

  // Delete subcollections (messages, etc.)
  await deleteSubcollection(ref, "messages");

  // Delete cross-refs
  await deleteQuery(adminDb.collection("postTags").where("postId", "==", postId));
  await deleteQuery(adminDb.collection("complaints").where("postId", "==", postId));
  await deletePostPlace(postId);
  await deletePostPhotos(postId);

  // Finally delete the post
  await ref.delete();

  return { ok: true as const };
}
