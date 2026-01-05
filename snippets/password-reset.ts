import { confirmPasswordReset, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../lib/firebase/client";

export async function sendResetEmail(email: string) {
  // Sutam e-pastu ar paroles atjaunosanas saiti.
  await sendPasswordResetEmail(auth, email, {
    url: process.env.NEXT_PUBLIC_RESET_REDIRECT_URL || "http://localhost:3000/auth/reset-password",
    handleCodeInApp: true,
  });
}

export async function confirmPasswordResetAction(oobCode: string, newPassword: string) {
  // Apstiprina paroles atjaunosanu ar kodu no e-pasta.
  await confirmPasswordReset(auth, oobCode, newPassword);
}
