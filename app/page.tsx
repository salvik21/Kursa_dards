import PostsList from "./posts-list";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <header className="mb-6 flex items-center justify-start max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">Pazaudēts &amp; Atrasts</h1>
      </header>

      <section className="max-w-5xl mx-auto space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Jaunākie sludinājumi</h2>
          <p className="text-sm text-gray-600">Pārlūkojiet pazudušos un atrastos priekšmetus.</p>
        </div>
        <PostsList />
      </section>

      <footer className="mt-10 border-t border-gray-200 pt-6 max-w-5xl mx-auto text-sm text-gray-700 space-y-1">
        <div className="text-center">
          <a href="/about" className="text-blue-600 hover:underline">
            Uzziniet par mums un kā iesniegt ieteikumus.
          </a>
        </div>
      </footer>
    </main>
  );
}
