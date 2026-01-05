"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { AdminBackButton } from "@/components/AdminBackButton";

type Tag = {
  id: string;
  name: string;
};

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTags = async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/tags", { cache: "no-store" });
      if (res.status === 403) {
        setError("Nav atlauts. Tikai administratoriem.");
        return;
      }
      if (!res.ok) throw new Error("Neizdevas ieladet birkas");
      const data = await res.json();
      setTags(data.tags ?? []);
    } catch (err: any) {
      setError(err?.message || "Neizdevas ieladet birkas");
    }
  };

  const removeTag = async (id: string) => {
    setError(null);
    try {
      const res = await fetch("/api/admin/tags", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403) throw new Error("Nav atlauts. Tikai administratoriem.");
        throw new Error(data?.error || "Neizdevas dzest birku");
      }
      setMessage("Birka dzesta");
      loadTags();
    } catch (err: any) {
      setError(err?.message || "Neizdevas dzest birku");
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!name.trim()) {
      setError("Birkas nosaukums ir obligats");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403) throw new Error("Nav atlauts. Tikai administratoriem.");
        throw new Error(data?.error || "Neizdevas izveidot birku");
      }
      setName("");
      setMessage("Birka izveidota");
      loadTags();
    } catch (err: any) {
      setError(err?.message || "Neizdevas izveidot birku");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parvaldit birkas</h1>
          <p className="text-sm text-gray-700">Admini var pievienot birkas, ko lietot sludinajumos.</p>
        </div>
        <AdminBackButton />
      </div>

      <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">Birkas nosaukums</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="piem., Maks, Elektronika, Dokumenti"
          />
        </div>
        {message && <p className="text-sm text-green-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white font-semibold shadow hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Saglaba..." : "Pievienot birku"}
        </button>
      </form>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Esosas birkas</h2>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {tags.length === 0 ? (
          <p className="text-sm text-gray-600">Birkas vel nav pievienotas.</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {tags.map((tag) => (
              <li
                key={tag.id}
                className="flex items-center justify-between rounded border border-gray-200 px-3 py-2 text-sm text-gray-800"
              >
                <span>{tag.name}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tag.id)}
                  className="rounded bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  Dzest
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
