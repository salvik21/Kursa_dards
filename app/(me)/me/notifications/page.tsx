import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server";
import NotificationSettings from "../NotificationSettings";

export const runtime = "nodejs";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/sign-in");
  }

  return (
    <main className="p-6 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Paziņojumi pēc rādiusa</h1>
            <p className="text-sm text-gray-700">
              Izvēlies punktu kartē un rādiusu, lai saņemtu e-pastus par jauniem sludinājumiem tuvumā.
            </p>
          </div>
          <a
            href="/me"
            className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
          >
            Atpakaļ uz profilu
          </a>
        </div>

        <NotificationSettings />
      </div>
    </main>
  );
}
