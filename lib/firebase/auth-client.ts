import {
  applyActionCode,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
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

async function ensureUserDoc(user: { uid: string; email?: string | null; displayName?: string | null; emailVerified?: boolean }) {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      email: user.email ?? "",
      displayName: user.displayName ?? "",
      role: "user",
      emailVerified: user.emailVerified ?? false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function signUp({ email, password, displayName }: SignUpParams) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }
  await sendEmailVerification(cred.user);
  await ensureUserDoc({ uid: cred.user.uid, email, displayName: displayName ?? "", emailVerified: false });
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

  // Notify UI about session change
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("session-changed"));
  }

  return cred.user;
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  await ensureUserDoc({
    uid: cred.user.uid,
    email: cred.user.email,
    displayName: cred.user.displayName,
    emailVerified: cred.user.emailVerified,
  });
  const idToken = await cred.user.getIdToken(true);
  const res = await fetch(SESSION_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    throw new Error("Failed to create session");
  }
  // Notify UI about session change
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("session-changed"));
  }
  return cred.user;
}

export async function logout() {
  await fetch(LOGOUT_ENDPOINT, { method: "POST" });
  await signOut(auth);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("session-changed"));
  }
}

export async function resendVerificationEmail() {
  if (!auth.currentUser) {
    throw new Error("No current user");
  }
  await sendEmailVerification(auth.currentUser);
}

export async function sendResetEmail(email: string) {
  await sendPasswordResetEmail(auth, email, {
    url: process.env.NEXT_PUBLIC_RESET_REDIRECT_URL || "http://localhost:3000/auth/reset-password",
    handleCodeInApp: true,
  });
}

export async function applyEmailVerification(oobCode: string) {
  await applyActionCode(auth, oobCode);
}

export async function confirmPasswordResetAction(oobCode: string, newPassword: string) {
  await confirmPasswordReset(auth, oobCode, newPassword);
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error("Nav aktīva lietotāja");
  }
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}
