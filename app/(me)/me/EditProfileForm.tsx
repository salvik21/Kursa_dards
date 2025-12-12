"use client";

import { useEffect, useState, FormEvent } from "react";

type Profile = {
  name: string;
  email: string;
  phone: string;
};

export default function EditProfileForm() {
  const [profile, setProfile] = useState<Profile>({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load profile");
      setProfile({
        name: json.user?.name ?? "",
        email: json.user?.email ?? "",
        phone: json.user?.phone ?? "",
      });
    } catch (err: any) {
      setStatus(err?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.name, phone: profile.phone, email: profile.email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to update profile");
      setStatus("Profile updated");
    } catch (err: any) {
      setStatus(err?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const onDeleteAccount = async () => {
    const confirmed = window.confirm("Delete your account and all your posts? This cannot be undone.");
    if (!confirmed) return;
    setDeleting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/me", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to delete account");
      setStatus("Account deleted");
      window.location.href = "/auth/sign-in";
    } catch (err: any) {
      setStatus(err?.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="mt-6 rounded border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
          <p className="text-sm text-gray-600">Update your name and phone.</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded border border-gray-300 px-3 py-1 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition disabled:opacity-60"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-800">Name</label>
          <input
            value={profile.name}
            onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Your name"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-800">Phone</label>
          <input
            value={profile.phone}
            onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="+371 ..."
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-800">Email</label>
          <input
            value={profile.email}
            onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500">This email is used for contact; it does not change your login.</p>
        </div>
        {status && <p className="text-sm text-amber-700">{status}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={onDeleteAccount}
            className="rounded bg-red-600 px-4 py-2 text-white font-semibold hover:bg-red-700 transition disabled:opacity-60"
          >
            {deleting ? "Deleting..." : "Delete account"}
          </button>
        </div>
      </form>
    </section>
  );
}
