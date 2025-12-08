import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server";

export const runtime = "nodejs";

export default async function UserRedirectPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/sign-in");
  }

  if (user.role === "admin") {
    redirect("/admin");
  }

  redirect("/me");
}
