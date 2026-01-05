import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server";
import MeDashboard from "./MeDashboard";

export const runtime = "nodejs";

export default async function MeHome() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/sign-in");
  }

  return (
    <div className="p-6">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4">
        <div className="w-full text-center">
          <h1 className="text-2xl font-semibold mb-2">Mans konts</h1>
          <p className="text-sm text-gray-700">
            Pieslegts ka {user.email ?? user.uid} (loma: {user.role ?? "nezinama"})
          </p>
        </div>
        <div className="w-full">
          <MeDashboard user={{ email: user.email, uid: user.uid, role: user.role }} />
        </div>
      </div>
    </div>
  );
}
