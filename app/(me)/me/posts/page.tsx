"use client";

import useSWR from "swr";
import Link from "next/link";
import { useState } from "react";

type Post = {
  id: string;
  title: string;
  type: string;
  status: string;
  category: string;
  placeName?: string | null;
  createdAt?: string | null;
  blockedReason?: string | null;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  open: "bg-green-100 text-green-800 border-green-200",
  resolved: "bg-blue-100 text-blue-800 border-blue-200",
  hidden: "bg-gray-100 text-gray-700 border-gray-200",
  closed: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function MyPostsPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/me/posts", fetcher);
  const posts: Post[] = data?.posts ?? [];
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deletePost = async (id: string) => {
    const confirmed = window.confirm("Dzēst šo sludinājumu un tā datus?");
    if (!confirmed) return;
    setDeletingId(id);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Neizdevās dzēst sludinājumu");
      mutate();
    } catch (err: any) {
      setDeleteError(err?.message || "Neizdevās dzēst sludinājumu");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mani sludinājumi</h1>
          <p className="text-sm text-gray-700">Skatiet un rediģējiet savus sludinājumus.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/posts/new"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition"
          >
            Izveidot jaunu
          </Link>
          <Link
            href="/me"
            className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
          >
            Atpakaļ
          </Link>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">Neizdevās ielādēt sludinājumus</p>}
      {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
      {isLoading && <p className="text-sm text-gray-600">Ielādē...</p>}

      {!isLoading && posts.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-sm">
          Pagaidām nav sludinājumu.{" "}
          <Link href="/posts/new" className="text-blue-600 hover:underline">
            Izveidojiet savu pirmo sludinājumu.
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusColors[p.status] ?? ""}`}
                  >
                    {p.status}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
                    {p.type === "lost" ? "Pazudis" : "Atrasts"}
                  </span>
                </div>
                <div className="text-sm font-semibold text-gray-900">{p.title}</div>
                <div className="text-xs text-gray-600">
                  {p.category}
                  {p.placeName && ` | ${p.placeName}`}
                  {p.createdAt && ` | ${new Date(p.createdAt).toLocaleDateString()}`}
                </div>
                {p.status === "hidden" && p.blockedReason && (
                  <div className="text-xs text-red-700">
                    Paslēpts administratora dēļ: {p.blockedReason}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/posts/${p.id}`}
                  className="rounded border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
                >
                  Skatīt
                </Link>
                <Link
                  href={`/posts/${p.id}/edit`}
                  className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
                >
                  Rediģēt
                </Link>
                <button
                  type="button"
                  onClick={() => deletePost(p.id)}
                  disabled={deletingId === p.id}
                  className="rounded bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-60"
                >
                  {deletingId === p.id ? "Notiek dzēšana..." : "Dzēst"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
