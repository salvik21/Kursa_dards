import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server";
import Link from "next/link";

export const runtime = "nodejs";

export default async function MeHome() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/sign-in");
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold mb-2">My account</h1>
        <p className="text-sm text-gray-700">
          Signed in as {user.email ?? user.uid} (role: {user.role ?? "unknown"})
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/posts/new"
          className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white font-semibold shadow hover:bg-blue-700 transition"
        >
          Create new post
        </Link>
        <Link
          href="/me/posts"
          className="inline-flex items-center gap-2 rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition"
        >
          My posts
        </Link>
        {user.role === "admin" && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded border border-gray-300 px-4 py-2 text-blue-600 font-semibold hover:bg-blue-50 transition"
          >
            Admin dashboard
          </Link>
        )}
      </div>

      <div className="space-y-2">
        <Link
          href="/me/profile"
          className="inline-flex items-center gap-2 rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition"
        >
          Профиль и контакты
        </Link>
        <Link
          href="/me/notifications"
          className="inline-flex items-center gap-2 rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition"
        >
          Настройки оповещений
        </Link>
      </div>
    </div>
  );
}
