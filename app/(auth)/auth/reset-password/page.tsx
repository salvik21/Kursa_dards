"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { confirmPasswordResetAction } from "@/lib/firebase/auth-client";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const oobCode = useMemo(() => searchParams.get("oobCode") || "", [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!oobCode) {
      setError("Missing reset code.");
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      await confirmPasswordResetAction(oobCode, newPassword);
      setInfo("Password updated. You can now sign in.");
      router.push("/auth/sign-in");
    } catch (err: any) {
      setError(err?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!oobCode) {
    return (
      <div className="mx-auto max-w-md p-6">
        <h1 className="text-2xl font-semibold mb-4">Reset password</h1>
        <p className="text-sm text-red-600">Reset link is invalid or missing.</p>
        <a href="/auth/forgot-password" className="mt-4 inline-block text-blue-600 underline">
          Request a new link
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Set new password</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full rounded border px-3 py-2"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-amber-600">{info}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}
