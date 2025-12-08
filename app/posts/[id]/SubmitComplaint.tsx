"use client";

import { useState, FormEvent } from "react";

export default function SubmitComplaint({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (!reason.trim()) {
      setStatus("Опишите проблему перед отправкой.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/complaints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, reporterName: name, reporterEmail: email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Не удалось отправить жалобу");
      setStatus("Жалоба отправлена. Мы рассмотрим её как можно скорее.");
      setReason("");
      setName("");
      setEmail("");
    } catch (err: any) {
      const msg = err?.message || "Не удалось отправить жалобу";
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
        {open ? "Скрыть форму жалобы" : "Пожаловаться на объявление"}
      </button>

      {open && (
        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-800">Ваше имя (необязательно)</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Иван Иванов"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-800">Email (необязательно)</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-800">Текст жалобы *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Опишите, что не так с объявлением..."
            />
          </div>
          {status && <p className="text-sm text-amber-700">{status}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? "Отправка..." : "Отправить жалобу"}
          </button>
        </form>
      )}
    </div>
  );
}
