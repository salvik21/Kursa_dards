"use client";

import { useState, FormEvent } from "react";

export default function ContactOwner({ postId, ownerEmail }: { postId: string; ownerEmail?: string | null }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (!message.trim()) {
      setStatus("Message is required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, message }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to send");
      setStatus("Message sent to the owner.");
      setMessage("");
    } catch (err: any) {
      setStatus(err?.message || "Failed to send");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 transition"
      >
        {open ? "Hide contact form" : "Contact owner"}
      </button>

      {open && (
        <form onSubmit={onSubmit} className="space-y-3 rounded border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-800">Your email (optional)</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-800">Phone (optional)</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="+371 ..."
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-800">Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Write a short message to the owner..."
            />
          </div>
          {status && <p className="text-sm text-amber-700">{status}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send message"}
          </button>
        </form>
      )}
    </div>
  );
}
