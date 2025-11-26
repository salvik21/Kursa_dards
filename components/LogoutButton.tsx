"use client";

import { logout } from "@/lib/firebase/auth-client";

export function LogoutButton() {
  return <button onClick={() => logout()}>Logout</button>;
}
