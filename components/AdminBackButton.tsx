"use client";

import Link from "next/link";

type AdminBackButtonProps = {
  href?: string;
  label?: string;
  className?: string;
};

export function AdminBackButton({ href = "/admin", label = "Atpakal uz adminu", className = "" }: AdminBackButtonProps) {
  return (
    <Link
      href={href}
      className={`rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition ${className}`.trim()}
    >
      {label}
    </Link>
  );
}
