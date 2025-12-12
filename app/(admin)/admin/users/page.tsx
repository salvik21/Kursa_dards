"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminBackButton } from "@/components/AdminBackButton";

type UserItem = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role?: string;
  blocked?: boolean;
  canLogin?: boolean;
  createdAt?: string | null;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [roleUpdatingId, setRoleUpdatingId] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Neizdevās ielādēt lietotājus");
      }
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch (err: any) {
      setError(err?.message || "Neizdevās ielādēt lietotājus");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleBlock = async (id: string, blocked: boolean) => {
    setUpdatingId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, blocked }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Neizdevās atjaunināt lietotāju");
      }
      load();
    } catch (err: any) {
      setError(err?.message || "Neizdevās atjaunināt lietotāju");
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleRole = async (id: string, role: "admin" | "user") => {
    setRoleUpdatingId(id);
    setError(null);
    setRoleError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Neizdevās atjaunināt lomu");
      }
      load();
    } catch (err: any) {
      setError(err?.message || "Neizdevās atjaunināt lomu");
      setRoleError(err?.message || null);
    } finally {
      setRoleUpdatingId(null);
    }
  };

  const deleteUser = async (id: string) => {
    const confirmed = window.confirm("Dzēst šo lietotāju un visus viņa sludinājumus?");
    if (!confirmed) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Neizdevās dzēst lietotāju");
      }
      load();
    } catch (err: any) {
      setError(err?.message || "Neizdevās dzēst lietotāju");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lietotāji</h1>
          <p className="text-sm text-gray-700">Aplūkojiet lietotāju sarakstu un datus (tikai adminiem).</p>
        </div>
        <div className="flex gap-2">
          <AdminBackButton />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-gray-600">Ielādē...</p>}

      {users.length === 0 && !loading ? (
        <p className="text-sm text-gray-600">Lietotāji nav atrasti.</p>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-gray-900">
                    {u.name || "Bez vārda"}{" "}
                    <span className="text-xs text-gray-500">({u.role === "admin" ? "administrators" : "lietotājs"})</span>
                  </div>
                  <div className="text-sm text-gray-700">{u.email}</div>
                  {u.phone && <div className="text-sm text-gray-700">Tālrunis: {u.phone}</div>}
                  {u.createdAt && (
                    <div className="text-xs text-gray-500">Izveidots: {new Date(u.createdAt).toLocaleString()}</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 text-xs">
                  <span
                    className={`rounded-full px-2 py-1 ${
                      u.blocked ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                    }`}
                  >
                    {u.blocked ? "Bloķēts" : "Aktīvs"}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">
                    {u.canLogin === false ? "Pieteikšanās liegta" : "Pieteikšanās atļauta"}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleBlock(u.id, !u.blocked)}
                    disabled={updatingId === u.id}
                    className={`mt-2 rounded px-3 py-1 text-xs font-semibold shadow ${
                      u.blocked
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-red-600 text-white hover:bg-red-700"
                    } disabled:opacity-60`}
                  >
                    {updatingId === u.id
                      ? "Atjaunina..."
                      : u.blocked
                        ? "Atbloķēt"
                        : "Bloķēt"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleRole(u.id, u.role === "admin" ? "user" : "admin")}
                    disabled={roleUpdatingId === u.id}
                    className="rounded px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
                  >
                    {roleUpdatingId === u.id
                      ? "Atjaunina..."
                      : u.role === "admin"
                        ? "Noņemt administratoru"
                        : "Piešķirt administratoru"}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteUser(u.id)}
                    disabled={deletingId === u.id}
                    className="rounded px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    {deletingId === u.id ? "Dzēš..." : "Dzēst lietotāju"}
                  </button>
                  {roleError && roleUpdatingId === u.id && (
                    <p className="text-[11px] text-red-600">{roleError}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
