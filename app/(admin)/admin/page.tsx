import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { AdminContactEmailForm } from "./AdminContactEmailForm";

export const runtime = "nodejs";

export default async function AdminHome() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/sign-in");
  }
  if (user.role !== "admin") {
    redirect("/me");
  }

  const pendingSnap = await adminDb.collection("posts").where("status", "==", "pending").limit(1).get();
  const hasPending = !pendingSnap.empty;
  const complaintsOpenSnap = await adminDb
    .collection("complaints")
    .where("status", "in", ["accepted", "in_review"])
    .limit(1)
    .get();
  const hasComplaints = !complaintsOpenSnap.empty;

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Administratora panelis</h1>
          <p className="text-sm text-gray-700">
            Pieslegts ka {user.email ?? user.uid} (loma: {user.role ?? "nezinama"})
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
        >
          Atpakal uz sakumu
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div
          className={`rounded-xl border p-4 shadow-sm space-y-2 ${
            hasPending ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Sludinajumu moderacija</h2>
                {hasPending && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
                    Ir jauni parskatisanai
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">Parskatit jaunus sludinajumus, mainit statusu, slept spamu.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/posts"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Uz sludinajumiem
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Statistika un eksports</h2>
              <p className="text-sm text-gray-600">
                Lejupielade CSV un skaties lietosanas statistiku (pazudusie vienumi pa regioniem).
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/stats"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Skatit statistiku
            </a>
            <a
              href="/api/admin/stats?format=csv"
              className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
            >
              Eksportet CSV
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Lietotaji</h2>
              <p className="text-sm text-gray-600">Bloket parkapejus vai pieskirt admin lomu.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/users"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Uz lietotajiem
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Birkas</h2>
              <p className="text-sm text-gray-600">Izveidot un parvaldit birkas sludinajumiem.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/tags"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Parvaldit birkas
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Kategorijas</h2>
              <p className="text-sm text-gray-600">Izveidot vai dzest kategorijas (tikai adminiem).</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/categories"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Parvaldit kategorijas
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Vietu nosaukumi</h2>
              <p className="text-sm text-gray-600">Pievienot vai dzest sagatavotus vietu nosaukumus (tikai adminiem).</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/places"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Parvaldit vietas
            </a>
          </div>
        </div>
      </section>

      <AdminContactEmailForm />

      <section
        className={`rounded-xl border p-4 shadow-sm space-y-2 ${
          hasComplaints ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-white"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Sudzibas</h2>
              {hasComplaints && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
                  Ir jaunas sudzibas
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">Parskatit sudzibas un bloket sludinajumus pec vajadzibas.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href="/admin/complaints"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            Uz sudzibam
          </a>
        </div>
      </section>
    </main>
  );
}
