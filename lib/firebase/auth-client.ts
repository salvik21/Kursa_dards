import {
  applyActionCode,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./client";

const SESSION_ENDPOINT = "/api/auth/session";
const LOGOUT_ENDPOINT = "/api/auth/logout";

export type SignUpParams = {
  email: string;
  password: string;
  displayName?: string;
};

export async function signUp({ email, password, displayName }: SignUpParams) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }
  await sendEmailVerification(cred.user);

  const userRef = doc(db, "users", cred.user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      email,
      displayName: displayName ?? "",
      role: "user",
      emailVerified: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return cred.user;
}

export async function signIn(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await cred.user.getIdToken(true);

  const res = await fetch(SESSION_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    throw new Error("Failed to create session");
  }

  return cred.user;
}

export async function logout() {
  await fetch(LOGOUT_ENDPOINT, { method: "POST" });
  await signOut(auth);
}

export async function resendVerificationEmail() {
  if (!auth.currentUser) {
    throw new Error("No current user");
  }
  await sendEmailVerification(auth.currentUser);
}

export async function sendResetEmail(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function applyEmailVerification(oobCode: string) {
  await applyActionCode(auth, oobCode);
}

export async function confirmPasswordResetAction(oobCode: string, newPassword: string) {
  await confirmPasswordReset(auth, oobCode, newPassword);
}
