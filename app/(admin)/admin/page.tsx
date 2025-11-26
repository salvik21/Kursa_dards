import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server";

export default async function AdminHome() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/sign-in");
  }
  if (user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Admin area</h1>
      <p className="text-sm text-gray-700">
        Signed in as {user.email ?? user.uid} (role: {user.role ?? "unknown"})
      </p>
    </div>
  );
}
