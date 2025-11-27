"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { applyEmailVerification } from "@/lib/firebase/auth-client";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const oobCode = useMemo(() => searchParams.get("oobCode") || "", [searchParams]);

  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!oobCode) {
        setStatus("error");
        setMessage("Verification link is invalid or missing.");
        return;
      }
      setStatus("working");
      try {
        await applyEmailVerification(oobCode);
        setStatus("done");
        setMessage("Email verified. You can sign in now.");
        router.push("/auth/sign-in");
      } catch (err: any) {
        setStatus("error");
        setMessage(err?.message || "Failed to verify email.");
      }
    };
    run();
  }, [oobCode, router]);

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Verify email</h1>
      {status === "working" && <p>Verifying...</p>}
      {status === "done" && <p className="text-green-700">{message}</p>}
      {status === "error" && (
        <div className="space-y-2">
          <p className="text-red-600">{message}</p>
          <a href="/auth/sign-in" className="text-blue-600 underline">
            Back to sign in
          </a>
        </div>
      )}
      {status === "idle" && <p>Processing link...</p>}
    </div>
  );
}
