import Link from "next/link";
import PostsList from "./posts-list";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <header className="mb-6 flex items-center justify-start max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">Lost &amp; Found</h1>
      </header>

      <section className="max-w-5xl mx-auto space-y-4">
        <div className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Nereģistrēts lietotājs? Pieprasi reģistrāciju.
              </p>
              <p className="text-xs text-gray-600">
                Pieejamas visas meklēšanas un filtrēšanas iespējas, bet vari izveidot profilu, lai iesniegtu jaunu sludinājumu.
              </p>
            </div>
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Request registration
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900">Latest posts</h2>
          <p className="text-sm text-gray-600">Browse lost/found items.</p>
        </div>
        <PostsList />
      </section>
    </main>
  );
}
