"use client";

import { logout } from "@/lib/firebase/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LogoutButtonProps = {
  onLoggedOut?: () => void;
};

export function LogoutButton({ onLoggedOut }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      if (onLoggedOut) {
        onLoggedOut();
      }
      // Always send user to home after logout
      router.replace("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="rounded border border-gray-300 px-3 py-1 font-semibold text-gray-800 hover:bg-gray-50 transition"
    >
      {loading ? "Notiek izrakstīšanās..." : "Izrakstīties"}
    </button>
  );
}
