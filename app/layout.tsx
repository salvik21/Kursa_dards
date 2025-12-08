import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { HeaderUserBar } from "@/components/HeaderUserBar";
import { getSessionUser } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Kursa Dards",
  description: "Next.js + TypeScript starter",
};

// Ensure layout renders per-request so session is reflected in header
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getSessionUser();
  return (
    <html lang="en">
      <body>
        <header className="bg-white border-b border-gray-200">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-semibold text-gray-900">
              Lost &amp; Found
            </Link>
            <HeaderUserBar
              initialUser={
                sessionUser
                  ? {
                      id: sessionUser.uid,
                      email: sessionUser.email,
                      role: sessionUser.role,
                    }
                  : null
              }
            />
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
