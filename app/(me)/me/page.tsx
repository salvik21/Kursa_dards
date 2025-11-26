import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server";

export default async function MeHome() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/sign-in");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">My account</h1>
      <p className="text-sm text-gray-700">Signed in as {user.email ?? user.uid}</p>
    </div>
  );
}
