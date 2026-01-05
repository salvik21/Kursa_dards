import { redirect } from "next/navigation";

export default function ForgotRedirectPage() {
  redirect("/auth/forgot-password");
}
