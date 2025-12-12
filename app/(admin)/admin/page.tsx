import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server";

export const runtime = "nodejs";

export default async function AdminHome() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/sign-in");
  }
  if (user.role !== "admin") {
    redirect("/me");
  }

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Administratora panelis</h1>
          <p className="text-sm text-gray-700">
            Pieslēgts kā {user.email ?? user.uid} (loma: {user.role ?? "nezināma"})
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
        >
          Atpakaļ uz sākumu
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Sludinājumu moderācija</h2>
              <p className="text-sm text-gray-600">Pārskatīt jaunus sludinājumus, mainīt statusu, slēpt spamu.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/posts"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Uz sludinājumiem
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Statistika un eksports</h2>
              <p className="text-sm text-gray-600">
                Lejupielādē CSV un skaties lietošanas statistiku (pazudušie vienumi pa reģioniem).
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/stats"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Skatīt statistiku
            </a>
            <a
              href="/api/admin/stats?format=csv"
              className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
            >
              Eksportēt CSV
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Lietotāji</h2>
              <p className="text-sm text-gray-600">Bloķēt pārkāpējus vai piešķirt admin lomu.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/users"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Uz lietotājiem
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Birkas</h2>
              <p className="text-sm text-gray-600">Izveidot un pārvaldīt birkas sludinājumiem.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/tags"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Pārvaldīt birkas
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Kategorijas</h2>
              <p className="text-sm text-gray-600">Izveidot vai dzēst kategorijas (tikai adminiem).</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/categories"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Pārvaldīt kategorijas
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Vietu nosaukumi</h2>
              <p className="text-sm text-gray-600">Pievienot vai dzēst sagatavotus vietu nosaukumus (tikai adminiem).</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/places"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Pārvaldīt vietas
            </a>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Sūdzības</h2>
            <p className="text-sm text-gray-600">Pārskatīt sūdzības un bloķēt sludinājumus pēc vajadzības.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href="/admin/complaints"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            Uz sūdzībām
          </a>
        </div>
      </section>

      {/* Statistika bloks noņemts pēc lietotāja pieprasījuma */}
    </main>
  );
}
