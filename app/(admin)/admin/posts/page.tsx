"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminBackButton } from "@/components/AdminBackButton";

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
   blockedByEmail?: string | null;
  blockedAt?: string | null;
  privateNote?: string | null;
};

function PostsHeader({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="flex flex-col gap-2 border-b border-gray-200 pb-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Admin · Sludinājumi</div>
          <h1 className="text-3xl font-bold text-gray-900">Sludinājumu moderācija</h1>
          <p className="text-sm text-gray-700">Apstipriniet vai bloķējiet sludinājumus pirms publicēšanas.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
          >
            Atsvaidzināt
          </button>
          <AdminBackButton label="Atpakaļ uz adminu" />
        </div>
      </div>
    </div>
  );
}

export default function AdminPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [blockReasons, setBlockReasons] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const deletePost = async (id: string) => {
    const confirmed = window.confirm("Delete this post permanently?");
    if (!confirmed) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to delete");
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <PostsHeader onRefresh={load} />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-gray-600">Loading...</p>}

      {posts.length === 0 && !loading ? (
        <p className="text-sm text-gray-600">No posts found.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => {
            const isNew =
              p.createdAt && !Number.isNaN(Date.parse(p.createdAt))
                ? Date.now() - new Date(p.createdAt).getTime() < 1000 * 60 * 60 * 24
                : false;
            return (
            <article
              key={p.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm cursor-pointer"
              role="button"
              tabIndex={0}
            onClick={() => router.push(`/admin/posts/${p.id}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(`/admin/posts/${p.id}`);
              }
            }}
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
                  {p.privateNote && (
                    <div className="text-xs text-amber-800 rounded border border-amber-200 bg-amber-50 px-2 py-1 inline-block">
                      Private note: {p.privateNote}
                    </div>
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
                <div
                  className="flex flex-col items-end gap-2 text-xs"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                        p.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : p.status === "hidden"
                            ? "bg-red-100 text-red-700"
                            : p.status === "resolved"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                      }`}
                    >
                      {p.status === "pending"
                        ? "Nepārskatīts"
                        : p.status === "hidden"
                          ? "Bloķēts"
                          : p.status === "resolved"
                            ? "Atrisināts"
                            : "Atvērts"}
                    </span>
                  </div>
                  {p.blockedReason && (
                    <span className="text-xs text-red-700">
                      Bloķēts: {p.blockedReason} {p.blockedByEmail ? `(bloķēja ${p.blockedByEmail})` : ""}
                    </span>
                  )}
                  <span className="text-xs text-gray-600">
                    Pārbaudīja: {p.blockedByEmail || "nav pārbaudīts"}
                  </span>
                </div>
              </div>
            </article>
          );
          })}
        </div>
      )}
    </main>
  );
}
