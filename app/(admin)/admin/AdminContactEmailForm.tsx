"use client";

import { useEffect, useState } from "react";

export function AdminContactEmailForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/settings/contact", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Neizdevās ielādēt kontaktu");
        setEmail(json.email ?? "");
      } catch (err: any) {
        setError(err?.message || "Neizdevās ielādēt kontaktu");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/settings/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Neizdevās saglabāt");
      setSuccess("Kontakta e-pasts saglabāts.");
    } catch (err: any) {
      setError(err?.message || "Neizdevās saglabāt");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Kontakta e-pasts</h2>
        <p className="text-sm text-gray-600">
          E-pasts, kas tiks rādīts lapas kājenē ieteikumiem par birkām/kategorijām.
        </p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-800" htmlFor="contact-email">
          Administrācijas e-pasts
        </label>
        <input
          id="contact-email"
          type="email"
          value={email}
          disabled={loading || saving}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          placeholder="admin@example.com"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || loading}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition disabled:opacity-60"
        >
          {saving ? "Saglabā..." : "Saglabāt"}
        </button>
        {success && <span className="text-sm text-green-700">{success}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}
