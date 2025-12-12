import { adminAuth, adminDb } from "./firebase/admin";
import { deletePostWithRelations } from "./deletePost";

type DeleteUserOptions = {
  protectLastAdmin?: boolean;
};

export async function deleteUserAccount(uid: string, options: DeleteUserOptions = {}) {
  const { protectLastAdmin = true } = options;
  const userRef = adminDb.collection("users").doc(uid);
  const userSnap = await userRef.get();
  const role = (userSnap.data() as any)?.role ?? "user";

  if (protectLastAdmin && role === "admin") {
    const adminsSnap = await adminDb.collection("users").where("role", "==", "admin").get();
    const adminCount = adminsSnap.size;
    if (adminCount <= 1) {
      throw new Error("Cannot delete the last admin");
    }
  }

  // Delete all posts by the user (with relations)
  const postsSnap = await adminDb.collection("posts").where("userId", "==", uid).get();
  for (const doc of postsSnap.docs) {
    await deletePostWithRelations(doc.id);
  }

  // Delete subscriptions
  const subsSnap = await adminDb.collection("subscriptions").where("userId", "==", uid).get();
  if (!subsSnap.empty) {
    const batch = adminDb.batch();
    subsSnap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  // Delete user doc
  await userRef.delete();

  // Delete auth user (best-effort)
  try {
    await adminAuth.deleteUser(uid);
  } catch (error: any) {
    // Ignore if user already removed
    if (error?.code !== "auth/user-not-found") {
      throw error;
    }
  }

  return { postsDeleted: postsSnap.size };
}
