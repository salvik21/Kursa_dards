"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ComplaintItem = {
  id: string;
  postId: string;
  postTitle?: string | null;
  postStatus?: string | null;
  reporterName?: string | null;
  reporterEmail?: string | null;
  userId?: string | null;
  reason: string;
  status: string;
  createdAt?: string | null;
  blockReason?: string | null;
  blockedByAdminId?: string | null;
  blockedAt?: string | null;
};

const statusLabels: Record<string, string> = {
  accepted: "Accepted",
  in_review: "In review",
  closed: "Closed",
};

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [blockReasons, setBlockReasons] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/complaints", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Не удалось загрузить жалобы");
      setComplaints(json.complaints ?? []);
    } catch (err: any) {
      setError(err?.message || "Не удалось загрузить жалобы");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Не удалось обновить статус");
      await load();
    } catch (err: any) {
      setError(err?.message || "Не удалось обновить статус");
    } finally {
      setUpdatingId(null);
    }
  };

  const blockPost = async (complaint: ComplaintItem) => {
    const reason = blockReasons[complaint.id]?.trim();
    if (!reason) {
      setError("Укажите причину блокировки");
      return;
    }
    setUpdatingId(complaint.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: complaint.id, status: "closed", blockReason: reason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Не удалось заблокировать объявление");
      setBlockReasons((prev) => ({ ...prev, [complaint.id]: "" }));
      await load();
    } catch (err: any) {
      setError(err?.message || "Не удалось заблокировать объявление");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Жалобы пользователей</h1>
          <p className="text-sm text-gray-700">Review complaints, update status, and block posts if needed.</p>
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

      {complaints.length === 0 && !loading ? (
        <p className="text-sm text-gray-600">No complaints yet.</p>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <article
              key={c.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm text-gray-700">
                    Complaint ID: <span className="font-semibold text-gray-900">{c.id}</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    Reporter:{" "}
                    <span className="font-semibold text-gray-900">
                      {c.reporterName || c.reporterEmail || (c.userId === "0" ? "Guest" : c.userId)}
                    </span>
                    {c.reporterEmail && (
                      <span className="ml-2 text-xs text-gray-600">({c.reporterEmail})</span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    Post:{" "}
                    {c.postId ? (
                      <Link href={`/posts/${c.postId}`} className="text-blue-600 hover:underline">
                        {c.postTitle || c.postId}
                      </Link>
                    ) : (
                      "Не указано"
                    )}{" "}
                    {c.postStatus && (
                      <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        Post status: {c.postStatus}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600">
                    {c.createdAt && `Created: ${new Date(c.createdAt).toLocaleString()}`}
                    {c.blockedAt &&
                      ` · Blocked at: ${new Date(c.blockedAt).toLocaleString()} by ${c.blockedByAdminId || "admin"}`}
                  </div>
                  <p className="whitespace-pre-wrap text-gray-900">{c.reason}</p>
                  {c.blockReason && (
                    <p className="text-sm text-gray-800">
                      Block reason: <span className="font-semibold text-gray-900">{c.blockReason}</span>
                    </p>
                  )}
                </div>

                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                  {statusLabels[c.status] || c.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-sm">
                <button
                  type="button"
                  disabled={updatingId === c.id}
                  onClick={() => setStatus(c.id, "accepted")}
                  className="rounded border border-gray-300 px-3 py-1 font-semibold text-gray-800 hover:bg-gray-50 transition disabled:opacity-60"
                >
                  Accepted
                </button>
                <button
                  type="button"
                  disabled={updatingId === c.id}
                  onClick={() => setStatus(c.id, "in_review")}
                  className="rounded border border-blue-200 bg-blue-50 px-3 py-1 font-semibold text-blue-700 hover:bg-blue-100 transition disabled:opacity-60"
                >
                  In review
                </button>
                <button
                  type="button"
                  disabled={updatingId === c.id}
                  onClick={() => setStatus(c.id, "closed")}
                  className="rounded border border-green-200 bg-green-50 px-3 py-1 font-semibold text-green-700 hover:bg-green-100 transition disabled:opacity-60"
                >
                  Closed
                </button>
              </div>

              <div className="space-y-2 rounded border border-red-200 bg-red-50 p-3">
                <div className="text-sm font-semibold text-red-800">Block the post</div>
                <textarea
                  value={blockReasons[c.id] ?? ""}
                  onChange={(e) =>
                    setBlockReasons((prev) => ({
                      ...prev,
                      [c.id]: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
                  placeholder="Block reason (required)"
                />
                <button
                  type="button"
                  disabled={updatingId === c.id}
                  onClick={() => blockPost(c)}
                  className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-60"
                >
                  {updatingId === c.id ? "Applying..." : "Block post"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
