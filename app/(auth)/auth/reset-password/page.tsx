"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { confirmPasswordResetAction } from "@/lib/firebase/auth-client";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Nolasa oobCode no URL (atsutits Firebase e-pasta).
  const oobCode = useMemo(() => searchParams.get("oobCode") || "", [searchParams]);

  // Formas stavoklis: ievades lauki, ielade un pazinojumi.
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    // Apstrada formas nosutisanu.
    e.preventDefault();
    if (!oobCode) {
      setError("Trukst atjaunosanas koda.");
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      // Apstiprina paroles atjaunosanu ar oobCode no e-pasta.
      await confirmPasswordResetAction(oobCode, newPassword);
      setInfo("Parole atjaunota. Tagad vari pieslegties.");
      // Parnavigacija uz pieslegsanos lapu pec veiksmigas atjaunosanas.
      router.push("/auth/sign-in");
    } catch (err: any) {
      setError(err?.message || "Neizdevas atjaunot paroli");
    } finally {
      setLoading(false);
    }
  };

  if (!oobCode) {
    return (
      <div className="mx-auto max-w-md p-6">
        <h1 className="text-2xl font-semibold mb-4">Atjaunot paroli</h1>
        {/* Parada kludu, ja saite nav deriga vai kods trukst. */}
        <p className="text-sm text-red-600">Paroles atjaunošanas saite ir nederīga vai trūkst.</p>
        <a href="/auth/forgot-password" className="mt-4 inline-block text-blue-600 underline">
          Pieprasīt jaunu saiti
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Iestatīt jaunu paroli</h1>
      {/* Jaunas paroles ievade un nosutisana uz Firebase. */}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Jaunā parole</label>
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
          {loading ? "Atjauno..." : "Atjaunot paroli"}
        </button>
      </form>
    </div>
  );
}
