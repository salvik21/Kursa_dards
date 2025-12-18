"use client";

import { useEffect, useState, FormEvent } from "react";
import { changePassword } from "@/lib/firebase/auth-client";

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
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdStatus, setPwdStatus] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const load = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Neizdevās ielādēt profilu");
      setProfile({
        name: json.user?.name ?? "",
        email: json.user?.email ?? "",
        phone: json.user?.phone ?? "",
      });
    } catch (err: any) {
      setStatus(err?.message || "Neizdevās ielādēt profilu");
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
      if (!res.ok) throw new Error(json?.error || "Neizdevās atjaunināt profilu");
      setStatus("Profils atjaunināts");
    } catch (err: any) {
      setStatus(err?.message || "Neizdevās atjaunināt profilu");
    } finally {
      setSaving(false);
    }
  };

  const onDeleteAccount = async () => {
    const confirmed = window.confirm("Dzēst kontu un visus ierakstus? Šo darbību nevar atsaukt.");
    if (!confirmed) return;
    setDeleting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/me", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Neizdevās dzēst kontu");
      setStatus("Konts dzēsts");
      window.location.href = "/auth/sign-in";
    } catch (err: any) {
      setStatus(err?.message || "Neizdevās dzēst kontu");
    } finally {
      setDeleting(false);
    }
  };

  const onChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwdStatus("Jaunā parole un apstiprinājums nesakrīt.");
      return;
    }
    setPwdSaving(true);
    setPwdStatus(null);
    try {
      await changePassword(currentPassword, newPassword);
      setPwdStatus("Parole atjaunināta.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwdStatus(err?.message || "Neizdevās atjaunināt paroli.");
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <>
      <section className="mt-6 rounded border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Profils</h2>
          <p className="text-sm text-gray-600">Atjaunojiet savu vārdu un tālruni.</p>
        </div>
        {loading && (
          <span className="text-sm text-gray-600" aria-live="polite">
            Atsvaidzina...
          </span>
        )}
      </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-800">Vārds</label>
            <input
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Jūsu vārds"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-800">Tālrunis</label>
            <input
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="+371 ..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-800">E-pasts</label>
            <input
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500">Šis e-pasts ir paredzēts saziņai; tas nemaina jūsu pieteikšanās e-pastu.</p>
          </div>
          {status && <p className="text-sm text-amber-700">{status}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
            >
              {saving ? "Saglabā..." : "Saglabāt izmaiņas"}
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={onDeleteAccount}
              className="rounded bg-red-600 px-4 py-2 text-white font-semibold hover:bg-red-700 transition disabled:opacity-60"
            >
              {deleting ? "Dzēš..." : "Dzēst kontu"}
            </button>
          </div>
        </form>
      </section>

      <section className="mt-6 rounded border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Paroles maiņa</h2>
            <p className="text-sm text-gray-600">Atjaunojiet savu pieteikšanās paroli.</p>
          </div>
        </div>

        <form onSubmit={onChangePassword} className="mt-4 space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-800">Pašreizējā parole</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-800">Jaunā parole</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-800">Apstipriniet jauno paroli</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          {pwdStatus && <p className="text-sm text-amber-700">{pwdStatus}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={pwdSaving}
              className="rounded bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
            >
              {pwdSaving ? "Saglabā..." : "Atjaunot paroli"}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
