"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PostItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  category: string;
  placeName?: string | null;
  description?: string;
  photos?: string[];
  createdAt?: string | null;
  blockedReason?: string | null;
  blockedBy?: string | null;
  blockedAt?: string | null;
};

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [blockReasons, setBlockReasons] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/posts", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load posts");
      setPosts(json.posts ?? []);
    } catch (err: any) {
      setError(err?.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id: string, status: string, blockReason?: string) => {
    setUpdatingId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, blockReason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to update");
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to update");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Posts moderation</h1>
          <p className="text-sm text-gray-700">Approve or block posts before publication.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
          >
            Refresh
          </button>
          <Link href="/admin" className="text-blue-600 hover:underline text-sm">
            Back to admin
          </Link>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-gray-600">Loading...</p>}

      {posts.length === 0 && !loading ? (
        <p className="text-sm text-gray-600">No posts found.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <article
              key={p.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-gray-900">
                    {p.title} <span className="text-xs text-gray-500">({p.type})</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {p.category}
                    {p.createdAt && ` • ${new Date(p.createdAt).toLocaleString()}`}
                  </div>
                  {p.placeName && <div className="text-sm text-gray-700">Place: {p.placeName}</div>}
                  {p.description && (
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{p.description}</p>
                  )}
                  {p.photos?.length ? (
                    <div className="flex gap-2">
                      {p.photos.slice(0, 3).map((url) => (
                        <img
                          key={url}
                          src={url}
                          alt="photo"
                          className="h-16 w-24 rounded object-cover border border-gray-200"
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2 text-xs">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">
                    Status: {p.status}
                  </span>
                  {p.blockedReason && (
                    <span className="text-xs text-red-700">
                      Blocked: {p.blockedReason} {p.blockedBy ? `(by ${p.blockedBy})` : ""}
                    </span>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={updatingId === p.id}
                      onClick={() => {
                        if (p.status === "hidden") {
                          setStatus(p.id, "open");
                          return;
                        }
                        const reason = blockReasons[p.id]?.trim();
                        if (!reason) {
                          setError("Block reason is required to hide a post.");
                          return;
                        }
                        setStatus(p.id, "hidden", reason);
                      }}
                      className={`rounded px-3 py-1 font-semibold ${
                        p.status === "hidden"
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-red-600 text-white hover:bg-red-700"
                      } disabled:opacity-60`}
                    >
                      {updatingId === p.id
                        ? "Updating..."
                        : p.status === "hidden"
                          ? "Unhide"
                          : "Hide"}
                    </button>
                    <button
                      type="button"
                      disabled={updatingId === p.id}
                      onClick={() => setStatus(p.id, "resolved")}
                      className="rounded px-3 py-1 font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      Resolve
                    </button>
                    <button
                      type="button"
                      disabled={updatingId === p.id}
                      onClick={() => setStatus(p.id, "open")}
                      className="rounded px-3 py-1 font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      Approve
                    </button>
                  </div>
                  {p.status !== "hidden" && (
                    <div className="w-full">
                      <textarea
                        value={blockReasons[p.id] ?? ""}
                        onChange={(e) =>
                          setBlockReasons((prev) => ({
                            ...prev,
                            [p.id]: e.target.value,
                          }))
                        }
                        rows={2}
                        className="mt-2 w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        placeholder="Block reason (required to hide)"
                      />
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
