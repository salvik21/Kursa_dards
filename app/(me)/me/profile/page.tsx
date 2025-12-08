import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server";
import EditProfileForm from "../EditProfileForm";

export const runtime = "nodejs";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/sign-in");
  }

  return (
    <main className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Профиль</h1>
          <p className="text-sm text-gray-700">Обновите имя и телефон.</p>
        </div>
        <a
          href="/me"
          className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
        >
          ← В аккаунт
        </a>
      </div>

      <EditProfileForm />
    </main>
  );
}
