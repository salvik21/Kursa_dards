import Link from "next/link";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/server";

export const runtime = "nodejs";

type PostSummary = {
  id: string;
  title: string;
  type: string;
  status: string;
  category: string;
  placeName: string | null;
  createdAt: string | null;
};

export default async function AdminStatsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/sign-in");
  }
  if (user.role !== "admin") {
    redirect("/me");
  }

  const snap = await adminDb.collection("posts").orderBy("createdAt", "desc").get();

  const posts: PostSummary[] = snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      title: data.title ?? "",
      type: data.type ?? "",
      status: data.status ?? "open",
      category: data.category ?? "",
      placeName: data.placeName ?? null,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
    };
  });

  const statusCounts = posts.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});

  const lostByRegion = posts
    .filter((p) => p.type === "lost")
    .reduce<Record<string, { label: string; count: number }>>((acc, p) => {
      const label = (p.placeName || "Unspecified").trim();
      const key = label.toLowerCase();
      acc[key] = { label, count: (acc[key]?.count ?? 0) + 1 };
      return acc;
    }, {});

  const lostByRegionList = Object.values(lostByRegion).sort((a, b) => b.count - a.count);

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stats &amp; export</h1>
          <p className="text-sm text-gray-700">
            System usage overview and CSV export for further analysis.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/admin/stats?format=csv"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
          >
            Download CSV
          </a>
          <Link
            href="/admin"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
          >
            Back to admin
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase text-gray-500">Total posts</div>
          <div className="text-3xl font-bold text-gray-900">{posts.length}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase text-gray-500">Lost</div>
          <div className="text-3xl font-bold text-gray-900">
            {posts.filter((p) => p.type === "lost").length}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase text-gray-500">Found</div>
          <div className="text-3xl font-bold text-gray-900">
            {posts.filter((p) => p.type === "found").length}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Statuses</h2>
            <p className="text-sm text-gray-600">Counts by current post status.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusCounts).map(([status, count]) => (
            <span
              key={status}
              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-800"
            >
              {status}: {count}
            </span>
          ))}
          {Object.keys(statusCounts).length === 0 && (
            <span className="text-sm text-gray-600">No data.</span>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Lost items by region</h2>
            <p className="text-sm text-gray-600">Grouped by place name provided in posts.</p>
          </div>
        </div>
        {lostByRegionList.length === 0 ? (
          <p className="text-sm text-gray-600">No lost items yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Region
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Lost items
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {lostByRegionList.map((item) => (
                  <tr key={item.label}>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.label}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-gray-900">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
