"use client";

import { useEffect, useState } from "react";
import { auth } from "../../lib/firebase/client";

export default function TestFirebasePage() {
  const [status, setStatus] = useState("Parbaudu Firebase...");

  useEffect(() => {
    try {
      const appName = auth.app.name;
      setStatus(`Firebase pieslegts! app name: ${appName}`);
      console.log("Firebase auth:", auth);
    } catch (error) {
      console.error(error);
      setStatus("Klauda inicializejot Firebase. Skaties konsoli.");
    }
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div>{status}</div>
    </main>
  );
}
