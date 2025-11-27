"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    // TODO: wire up Firebase email/password login
    setTimeout(() => setPending(false), 500);
  };

  const handleGoogle = () => {
    // TODO: wire up Google OAuth login
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
        <p className="mt-2 text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/auth/sign-up" className="text-blue-600 hover:underline">
            Create one
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-gray-800">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-semibold text-gray-800">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs uppercase text-gray-500">or</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-800 hover:bg-gray-50"
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
          Continue with Google
        </button>
      </div>
    </main>
  );
}
