import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Welcome</h1>
        <p className="text-gray-700">Choose an option to continue</p>
        <div className="grid grid-cols-1 gap-4">
          <Link
            href="/auth/login"
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-semibold shadow hover:bg-blue-700 transition"
          >
            Login
          </Link>
          <Link
            href="/auth/register"
            className="w-full rounded-lg border border-blue-600 px-4 py-3 text-blue-600 font-semibold hover:bg-blue-50 transition"
          >
            Register
          </Link>
        </div>
      </div>
    </main>
  );
}
