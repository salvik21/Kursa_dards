"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminActionsProps = {
  postId: string;
  status: string;
  blockedReason?: string;
};

export function AdminActions({ postId, status, blockedReason = "" }: AdminActionsProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
        setError("Lai paslēptu sludinājumu, jānorāda bloķēšanas iemesls.");
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
      if (!res.ok) throw new Error(json?.error || "Failed to update");
      router.push("/admin/posts");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to update");
    } finally {
      setUpdating(false);
    }
  };

  const deletePost = async () => {
    const confirmed = window.confirm("Delete this post permanently?");
    if (!confirmed) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to delete");
      router.push("/admin/posts");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to delete");
    } finally {
      setDeleting(false);
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
          placeholder="Bloķēšanas iemesls (obligāts, lai paslēptu)"
        />
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={updating}
          onClick={() => setStatus("open")}
          className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60"
        >
          Apstiprināt
        </button>
        <button
          type="button"
          disabled={updating}
          onClick={() => setStatus("hidden")}
          className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-60"
        >
          Bloķēt
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={deletePost}
          className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 transition disabled:opacity-60"
        >
          {deleting ? "Dzēš..." : "Dzēst"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
