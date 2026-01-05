"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminActionsProps = {
  postId: string;
  status: string;
  blockedReason?: string;
  userId?: string | null;
};

export function AdminActions({
  postId,
  status,
  blockedReason = "",
  userId = null,
}: AdminActionsProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [reason, setReason] = useState(blockedReason);
  const [error, setError] = useState<string | null>(null);
  const [showReason, setShowReason] = useState(false);

  const setStatus = async (nextStatus: string) => {
    if (nextStatus === "hidden") {
      if (!showReason) {
        setShowReason(true);
        return;
      }
      if (!reason.trim()) {
        setError("Lai pasleptu sludinajumu, janorada blokesanas iemesls.");
        return;
      }
    }
    setUpdating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: postId, status: nextStatus, blockReason: reason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Neizdevas atjauninat");
      router.push("/admin/posts");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Neizdevas atjauninat");
    } finally {
      setUpdating(false);
    }
  };

  const deletePost = async () => {
    const confirmed = window.confirm("Dzest so sludinajumu neatgriezeniski?");
    if (!confirmed) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Neizdevas dzest");
      router.push("/admin/posts");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Neizdevas dzest");
    } finally {
      setDeleting(false);
    }
  };

  const deleteUser = async () => {
    if (!userId) return;
    const confirmed = window.confirm(
      "Dzest lietotaju un visus vina datus (sludinajumus, abonementus u.c.)?"
    );
    if (!confirmed) return;
    setDeletingUser(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Neizdevas dzest lietotaju");
      router.push("/admin/users");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Neizdevas dzest lietotaju");
    } finally {
      setDeletingUser(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2 text-xs">
      {showReason && (
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          placeholder="Blokesanas iemesls (obligats, lai pasleptu)"
        />
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={updating}
          onClick={() => setStatus("open")}
          className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60"
        >
          Apstiprinat
        </button>
        <button
          type="button"
          disabled={updating}
          onClick={() => setStatus("hidden")}
          className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-60"
        >
          Bloket
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={deletePost}
          className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 transition disabled:opacity-60"
        >
          {deleting ? "Dzes..." : "Dzest"}
        </button>
        {userId && (
          <button
            type="button"
            disabled={deletingUser}
            onClick={deleteUser}
            className="rounded bg-red-800 px-4 py-2 text-sm font-semibold text-white hover:bg-red-900 transition disabled:opacity-60"
          >
            {deletingUser ? "Dzes lietotaju..." : "Dzest lietotaju"}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
