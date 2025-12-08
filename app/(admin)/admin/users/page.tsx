"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to load users");
      }
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch (err: any) {
      setError(err?.message || "Failed to load users");
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
        throw new Error(data?.error || "Failed to update user");
      }
      load();
    } catch (err: any) {
      setError(err?.message || "Failed to update user");
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
        throw new Error(data?.error || "Failed to update role");
      }
      load();
    } catch (err: any) {
      setError(err?.message || "Failed to update role");
      setRoleError(err?.message || null);
    } finally {
      setRoleUpdatingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-700">View user list and personal details (admin only).</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
          >
            Refresh
          </button>
          <Link href="/admin" className="text-blue-600 hover:underline text-sm">
            Back to admin
          </Link>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-gray-600">Loading...</p>}

      {users.length === 0 && !loading ? (
        <p className="text-sm text-gray-600">No users found.</p>
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
                    {u.name || "No name"}{" "}
                    <span className="text-xs text-gray-500">({u.role ?? "user"})</span>
                  </div>
                  <div className="text-sm text-gray-700">{u.email}</div>
                  {u.phone && <div className="text-sm text-gray-700">Phone: {u.phone}</div>}
                  {u.createdAt && (
                    <div className="text-xs text-gray-500">Created: {new Date(u.createdAt).toLocaleString()}</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 text-xs">
                  <span
                    className={`rounded-full px-2 py-1 ${
                      u.blocked ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                    }`}
                  >
                    {u.blocked ? "Blocked" : "Active"}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">
                    {u.canLogin === false ? "Login disabled" : "Login allowed"}
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
                      ? "Updating..."
                      : u.blocked
                        ? "Unblock"
                        : "Block"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleRole(u.id, u.role === "admin" ? "user" : "admin")}
                    disabled={roleUpdatingId === u.id}
                    className="rounded px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
                  >
                    {roleUpdatingId === u.id
                      ? "Updating..."
                      : u.role === "admin"
                        ? "Demote to user"
                        : "Promote to admin"}
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
