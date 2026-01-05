"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { AdminBackButton } from "@/components/AdminBackButton";

type Category = { id: string; name: string };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/categories", { cache: "no-store" });
      if (!res.ok) throw new Error("Neizdevas ieladet kategorijas");
      const data = await res.json();
      setCategories(data.categories ?? []);
    } catch (err: any) {
      setError(err?.message || "Neizdevas ieladet kategorijas");
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!name.trim()) {
      setError("Kategorijas nosaukums ir obligats");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Neizdevas izveidot kategoriju");
      }
      setName("");
      setMessage("Kategorija izveidota");
      loadCategories();
    } catch (err: any) {
      setError(err?.message || "Neizdevas izveidot kategoriju");
    } finally {
      setLoading(false);
    }
  };

  const removeCategory = async (id: string) => {
    setError(null);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Neizdevas dzest kategoriju");
      }
      setMessage("Kategorija dzesta");
      loadCategories();
    } catch (err: any) {
      setError(err?.message || "Neizdevas dzest kategoriju");
    }
  };

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parvaldit kategorijas</h1>
          <p className="text-sm text-gray-700">Admini var pievienot vai dzest kategorijas, ko lieto sludinajumos.</p>
        </div>
        <AdminBackButton />
      </div>

      <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">Kategorijas nosaukums</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="piem., Elektronika, Dokumenti, Majdzivnieki"
          />
        </div>
        {message && <p className="text-sm text-green-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white font-semibold shadow hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Saglaba..." : "Pievienot kategoriju"}
        </button>
      </form>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Esosas kategorijas</h2>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {categories.length === 0 ? (
          <p className="text-sm text-gray-600">Kategorijas vel nav pievienotas.</p>
        ) : (
          <ul className="space-y-2">
            {categories.map((cat) => (
              <li
                key={cat.id}
                className="flex items-center justify-between rounded border border-gray-200 px-3 py-2 text-sm text-gray-800"
              >
                <span>{cat.name}</span>
                <button
                  type="button"
                  onClick={() => removeCategory(cat.id)}
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
