"use client";

import { useState, FormEvent } from "react";

export default function SubmitComplaint({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (!reason.trim()) {
      setStatus("Iemesls ir obligāts.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/complaints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, reporterEmail: email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Neizdevās nosūtīt sūdzību");
      setStatus("Sūdzība nosūtīta. Paldies!");
      setReason("");
      setEmail("");
      setOpen(false);
    } catch (err: any) {
      const msg = err?.message || "Neizdevās nosūtīt sūdzību";
      setStatus(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded bg-red-600 px-4 py-2 text-white font-semibold hover:bg-red-700 transition"
      >
        {open ? "Paslēpt formu" : "Paziņot par sludinājumu"}
      </button>

      {open && (
        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-800">E-pasts (pēc izvēles)</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-800">Iemesls *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Aprakstiet, kāpēc ziņojat par sludinājumu..."
            />
          </div>
          {status && <p className="text-sm text-amber-700">{status}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? "Sūta..." : "Sūtīt sūdzību"}
          </button>
        </form>
      )}
    </div>
  );
}
