"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signInWithGoogle } from "@/lib/firebase/auth-client";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googlePending, setGooglePending] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Autorizacija ar Firebase un sesijas izveide servera puse.
      await signIn(email, password);
      router.push("/me");
    } catch (err: any) {
      const msg = err?.code === "auth/invalid-credential" || err?.code === "auth/invalid-login"
        ? "Nepareizs e-pasts vai parole."
        : err?.message || "Neizdevas pieteikties.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    if (googlePending) return;
    setGooglePending(true);
    setError(null);
    try {
      // Google OAuth pierakstisanas un sesijas izveide.
      await signInWithGoogle();
      router.push("/me");
    } catch (err: any) {
      setError(err?.message || "Neizdevas pieteikties ar Google.");
    } finally {
      setGooglePending(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Pieslegties</h1>
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
        <div className="space-y-2">
          <label className="block text-sm font-medium">Parole</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded border px-3 py-2"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Piesledzas..." : "Pieslegties"}
        </button>
      </form>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs uppercase text-gray-500">vai</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
      <button
        type="button"
        disabled={googlePending}
        onClick={onGoogle}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded border border-gray-300 px-4 py-2 font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
      >
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M23.52 12.2736C23.52 11.4455 23.4455 10.6455 23.3055 9.87363H12V14.4091H18.5455C18.264 15.9364 17.4091 17.2273 16.1182 18.091V21.0455H19.8455C22.091 19 23.52 15.9091 23.52 12.2736Z"
            fill="#4285F4"
          />
          <path
            d="M12 24C15.24 24 17.9545 22.9091 19.8455 21.0455L16.1182 18.091C15.091 18.7818 13.6818 19.1818 12 19.1818C8.87364 19.1818 6.22727 17.1182 5.28182 14.2727H1.43182V17.3182C3.31364 21.2273 7.31818 24 12 24Z"
            fill="#34A853"
          />
          <path
            d="M5.28182 14.2727C5.04545 13.5818 4.90909 12.8455 4.90909 12.0909C4.90909 11.3364 5.04545 10.6 5.28182 9.90909V6.86364H1.43182C0.709091 8.54545 0.318182 10.2727 0.318182 12.0909C0.318182 13.9091 0.709091 15.6364 1.43182 17.3182L5.28182 14.2727Z"
            fill="#FBBC05"
          />
          <path
            d="M12 4.81818C13.8364 4.81818 15.4545 5.44545 16.7455 6.67273L19.9364 3.48182C17.9545 1.63636 15.24 0.5 12 0.5C7.31818 0.5 3.31364 3.27273 1.43182 7.18182L5.28182 10.2273C6.22727 7.38182 8.87364 5.31818 12 5.31818V4.81818Z"
            fill="#EA4335"
          />
        </svg>
        Turpinat ar Google
      </button>
      <p className="mt-4 text-sm">
        <a href="/auth/forgot-password" className="text-blue-600 underline">
          Aizmirsi paroli?
        </a>
      </p>
      <p className="mt-2 text-sm">
        Nav konta?{" "}
        <a href="/auth/sign-up" className="text-blue-600 underline">
          Izveidot kontu
        </a>
      </p>
    </div>
  );
}
