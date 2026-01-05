"use client";

import { FormEvent, useState } from "react";
import { sendResetEmail } from "@/lib/firebase/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      // Nosuta paroles atjaunosanas e-pastu caur Firebase.
      await sendResetEmail(email);
      setInfo("Parbaudi e-pastu, lai sanemtu saiti paroles atjaunosanai.");
    } catch (err: any) {
      setError(err?.message || "Neizdevas nosutit paroles atjaunosanas e-pastu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Atjaunot paroli</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">E-pasts</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          {loading ? "Sutam..." : "Sutit atjaunosanas saiti"}
        </button>
      </form>
      <p className="mt-4 text-sm">
        Atceries paroli?{" "}
        <a href="/auth/sign-in" className="text-blue-600 underline">
          Atpakal uz pieteiksanos
        </a>
      </p>
    </div>
  );
}
