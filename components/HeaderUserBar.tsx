"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LogoutButton } from "./LogoutButton";
import { useRouter } from "next/navigation";

type SessionUser = {
  id: string;
  email?: string;
  role?: "user" | "admin";
};

type Props = {
  initialUser?: SessionUser | null;
};

export function HeaderUserBar({ initialUser }: Props) {
  const [user, setUser] = useState<SessionUser | null>(initialUser ?? null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/me", { cache: "no-store", credentials: "include" });
      if (!res.ok) {
        setUser(null);
      } else {
        const json = await res.json();
        setUser({
          id: json.user?.id,
          email: json.user?.email,
          role: json.user?.role,
        });
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const handler = () => load();
    const refreshHandler = () => {
      handler();
      router.refresh();
    };
    window.addEventListener("session-changed", refreshHandler);
    return () => window.removeEventListener("session-changed", refreshHandler);
  }, [load, router]);

  if (loading && !user) {
    return <span className="text-sm text-gray-600">Ielādē...</span>;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/auth/sign-in"
          className="rounded border border-blue-600 px-3 py-1 font-semibold text-blue-600 hover:bg-blue-50 transition"
        >
          Pieteikties
        </Link>
        <Link
          href="/auth/sign-up"
          className="rounded bg-blue-600 px-3 py-1 font-semibold text-white hover:bg-blue-700 transition"
        >
          Reģistrēties
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-700">
        {user.email ?? user.id}
        {user.role ? ` (${user.role})` : ""}
      </span>
      <Link
        href="/me"
        className="rounded border border-gray-300 px-3 py-1 font-semibold text-gray-800 hover:bg-gray-50 transition"
      >
        Konts
      </Link>
      {user.role === "admin" && (
        <Link
          href="/admin"
          className="rounded border border-blue-200 bg-blue-50 px-3 py-1 font-semibold text-blue-700 hover:bg-blue-100 transition"
        >
          Admins
        </Link>
      )}
      <LogoutButton onLoggedOut={load} />
    </div>
  );
}
