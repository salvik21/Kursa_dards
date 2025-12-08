import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server";

export const runtime = "nodejs";

export default async function AdminHome() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/sign-in");
  }
  if (user.role !== "admin") {
    redirect("/me");
  }

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Admin dashboard</h1>
          <p className="text-sm text-gray-700">
            Signed in as {user.email ?? user.uid} (role: {user.role ?? "unknown"})
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
        >
          Back to home
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Posts moderation</h2>
              <p className="text-sm text-gray-600">Review new posts, change status, hide spam.</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Required
            </span>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/posts"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Go to posts
            </a>
            <a
              href="/admin"
              className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
            >
              Refresh
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Stats &amp; export</h2>
              <p className="text-sm text-gray-600">
                Download CSV and see usage stats (lost items by region).
              </p>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              Reports
            </span>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/stats"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              View stats
            </a>
            <a
              href="/api/admin/stats?format=csv"
              className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
            >
              Export CSV
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Users</h2>
              <p className="text-sm text-gray-600">Block abusive users or promote to admin.</p>
            </div>
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              Manage
            </span>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/users"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Go to users
            </a>
            <a
              href="/admin"
              className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
            >
              Refresh
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Tags</h2>
              <p className="text-sm text-gray-600">Create and manage tags used in posts.</p>
            </div>
            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
              Admin only
            </span>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/tags"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Manage tags
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
              <p className="text-sm text-gray-600">Create or remove categories (admin only).</p>
            </div>
            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
              Admin only
            </span>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/categories"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Manage categories
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Place names</h2>
              <p className="text-sm text-gray-600">Add or remove preset place names (admin only).</p>
            </div>
            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
              Admin only
            </span>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/places"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Manage places
            </a>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Complaints</h2>
            <p className="text-sm text-gray-600">Review complaints and block posts when needed.</p>
          </div>
          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
            Moderation
          </span>
        </div>
        <div className="flex gap-2">
          <a
            href="/admin/complaints"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            Go to complaints
          </a>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Stats (placeholder)</h2>
        <p className="text-sm text-gray-600">
          Hook this up to Firestore aggregates: counts by type/status, new posts today, flagged items.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="text-xs uppercase text-gray-500">Open posts</div>
            <div className="text-2xl font-bold text-gray-900">—</div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="text-xs uppercase text-gray-500">Resolved</div>
            <div className="text-2xl font-bold text-gray-900">—</div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="text-xs uppercase text-gray-500">Flagged/hidden</div>
            <div className="text-2xl font-bold text-gray-900">—</div>
          </div>
        </div>
      </section>
    </main>
  );
}
