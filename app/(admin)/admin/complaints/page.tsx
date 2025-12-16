"use client";

import Link from "next/link";
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from "react";
import { AdminBackButton } from "@/components/AdminBackButton";

type ComplaintItem = {
  id: string;
  postId?: string | null;
  reporterName?: string | null;
  reporterEmail?: string | null;
  reason?: string | null;
  status: "accepted" | "in_review" | "closed";
  createdAt?: string | null;
  postTitle?: string | null;
  postStatus?: string | null;
  postSnippet?: string | null;
  postPhoto?: string | null;
  blockReason?: string | null;
  blockedByEmail?: string | null;
  blockedByAdminId?: string | null;
  closedByEmail?: string | null;
  closedByAdminId?: string | null;
};

const postStatusLabels: Record<string, { label: string; className: string }> = {
  open: { label: "Atverts", className: "bg-green-100 text-green-700" },
  pending: { label: "Gaida apstiprinajumu", className: "bg-amber-100 text-amber-700" },
  resolved: { label: "Atrisinats", className: "bg-blue-100 text-blue-700" },
  hidden: { label: "Blokets", className: "bg-red-100 text-red-700" },
  closed: { label: "Slegts", className: "bg-gray-100 text-gray-700" },
};

const complaintStatusLabels: Record<ComplaintItem["status"], { label: string; className: string }> = {
  accepted: { label: "Pieņemta", className: "bg-emerald-100 text-emerald-700" },
  in_review: { label: "Pārskatīšanā", className: "bg-amber-100 text-amber-700" },
  closed: { label: "Slēgta", className: "bg-gray-100 text-gray-700" },
};

function ComplaintsHeader({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lietotaju sudzibas</h1>
        <p className="text-sm text-gray-700">
          Pārskatiet sūdzības, mainiet statusu un pārvaldiet sludinājumu stāvokli, ja nepieciešams.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRefresh}
          className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
        >
          Atsvaidzinat
        </button>
        <AdminBackButton label="Atpakal uz adminu" />
      </div>
    </div>
  );
}

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<ComplaintItem["status"] | "all">("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const complaintsWithPost = complaints.filter((c) => !!c.postId);
  const filteredComplaints = useMemo(() => {
    if (statusFilter === "all") return complaintsWithPost;
    return complaintsWithPost.filter((c) => c.status === statusFilter);
  }, [complaintsWithPost, statusFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/complaints", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Neizdevas ieladet sudzibas");
      setComplaints(json.complaints ?? []);
    } catch (err: any) {
      setError(err?.message || "Neizdevas ieladet sudzibas");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (id: string, status: ComplaintItem["status"], opts?: { reload?: boolean }) => {
    const reload = opts?.reload !== false;
    setUpdatingId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Neizdevās atjaunināt statusu");
      if (reload) {
        await load();
      } else {
        setComplaints((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c))
        );
      }
    } catch (err: any) {
      setError(err?.message || "Neizdevās atjaunināt statusu");
    } finally {
      setUpdatingId(null);
    }
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const toReview = complaintsWithPost.filter((c) => c.status === "accepted");
    if (toReview.length === 0) return;
    toReview.forEach((c) => updateStatus(c.id, "in_review", { reload: false }));
  }, [complaintsWithPost, updateStatus]);

  const renderPostStatus = (status?: string | null) => {
    if (!status) return null;
    const info = postStatusLabels[status] ?? { label: status, className: "bg-gray-100 text-gray-700" };
    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${info.className}`}>
        {info.label}
      </span>
    );
  };

  const safeSnippet = (snippet?: string | null) => {
    if (!snippet) return "";
    return snippet.replace(/‚÷\?‚?/g, "...");
  };

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <ComplaintsHeader onRefresh={load} />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-gray-600">Ielade...</p>}
      {!loading && complaintsWithPost.length === 0 && (
        <p className="text-sm text-gray-600">Sudzibu vel nav.</p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-gray-800">Statusa filtrs:</span>
        {[
          { value: "all", label: "Visas" },
          { value: "accepted", label: complaintStatusLabels.accepted.label },
          { value: "in_review", label: complaintStatusLabels.in_review.label },
          { value: "closed", label: complaintStatusLabels.closed.label },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatusFilter(opt.value as ComplaintItem["status"] | "all")}
            className={`rounded px-3 py-1 text-sm font-semibold border transition ${
              statusFilter === opt.value
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredComplaints.map((c) => (
          <article
            key={c.id}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            role={c.postId ? "button" : undefined}
            tabIndex={c.postId ? 0 : -1}
            onClick={() => c.postId && window.location.assign(`/admin/posts/${c.postId}?from=complaints`)}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && c.postId) {
                e.preventDefault();
                window.location.assign(`/admin/posts/${c.postId}?from=complaints`);
              }
            }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  {c.postId ? (
                    <Link href={`/admin/posts/${c.postId}?from=complaints`} className="text-lg font-semibold text-blue-700 hover:underline">
                      {c.postTitle || "Nav noradits"}
                    </Link>
                  ) : (
                    <span className="text-lg font-semibold text-gray-900">{c.postTitle || "Nav noradits"}</span>
                  )}
                  {renderPostStatus(c.postStatus)}
                </div>

                <div className="text-xs text-gray-600 flex flex-wrap items-center gap-2">
                  {c.createdAt && <span>{new Date(c.createdAt).toLocaleString()}</span>}
                  {(c.reporterName || c.reporterEmail) && (
                    <span>
                      Ziņotājs: {c.reporterName || c.reporterEmail}
                      {c.reporterEmail && c.reporterName ? ` (${c.reporterEmail})` : ""}
                    </span>
                  )}
                </div>

                {c.postSnippet && (
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{safeSnippet(c.postSnippet)}</p>
                )}

                {c.reason && (
                  <span className="inline-flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
                    Sūdzības iemesls:
                    <span className="font-normal text-amber-900">{c.reason}</span>
                  </span>
                )}

                {c.postPhoto && (
                  <img
                    src={c.postPhoto}
                    alt="Sludinajuma foto"
                    className="h-24 w-32 rounded border border-gray-200 object-cover"
                  />
                )}
              </div>

              <div className="md:w-60 space-y-1 text-right text-sm">
                {renderPostStatus(c.postStatus)}
                <div className="flex justify-end">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${complaintStatusLabels[c.status]?.className ?? "bg-gray-100 text-gray-700"}`}
                  >
                    {complaintStatusLabels[c.status]?.label ?? c.status}
                  </span>
                </div>
                {c.blockReason && (
                  <p className="text-red-700">
                    Blokēts: {c.blockReason}
                    {c.blockedByEmail ? ` (bloķēja ${c.blockedByEmail})` : ""}
                  </p>
                )}
                <p className="text-xs text-gray-600">
                  Pārbaudīja: {c.closedByEmail || c.blockedByEmail || "nav norādīts"}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap justify-end gap-2">
              {(["in_review", "closed"] as ComplaintItem["status"][]).map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={updatingId === c.id || c.status === s}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateStatus(c.id, s);
                  }}
                  className={`rounded px-3 py-1 text-sm font-semibold border transition ${
                    c.status === s
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                  } ${updatingId === c.id ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {complaintStatusLabels[s]?.label ?? s}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
