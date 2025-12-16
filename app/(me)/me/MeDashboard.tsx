"use client";

import Link from "next/link";
import useSWR from "swr";
import { useMemo } from "react";

type Post = {
  id: string;
  title: string;
  status: string;
  type: string;
  category?: string;
  placeName?: string | null;
  createdAt?: string | null;
  distanceKm?: number | null;
};

type User = { email?: string | null; uid?: string; role?: string | null };

type ActionItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  onlyAdmin?: boolean;
};

const ACTIONS: ActionItem[] = [
  {
    id: "new",
    title: "Izveidot jaunu sludinājumu",
    description: "Pievieno jaunu pazudušu vai atrastu priekšmetu ar foto un aprakstu.",
    href: "/posts/new",
  },
  {
    id: "posts",
    title: "Mani sludinājumi",
    description: "Skatīt, rediģēt vai dzēst savus sludinājumus.",
    href: "/me/posts",
  },
  {
    id: "admin",
    title: "Administratora panelis",
    description: "Moderēt sludinājumus, pārvaldīt lietotājus, birkas, vietas un statistiku.",
    href: "/admin",
    onlyAdmin: true,
  },
  {
    id: "profile",
    title: "Profils un kontakti",
    description: "Atjauno kontaktinformāciju un konta detaļas.",
    href: "/me/profile",
  },
  {
    id: "notifications",
    title: "Paziņojumu iestatījumi",
    description: "Pārvaldi abonementus un attālumus, par kuriem saņem paziņojumus.",
    href: "/me/notifications",
  },
];

const statusLabels: Record<string, string> = {
  pending: "Gaida apstiprinājumu",
  open: "Atvērts",
  resolved: "Atrisināts",
  hidden: "Paslēpts",
  closed: "Slēgts",
};

export default function MeDashboard({ user }: { user: User }) {
  const items = useMemo(
    () => ACTIONS.filter((a) => !a.onlyAdmin || user.role === "admin"),
    [user.role]
  );

  const { data: myPostsData, error: myPostsError, isLoading: myPostsLoading } = useSWR(
    "/api/me/posts",
    (url) => fetch(url).then((r) => r.json())
  );
  const myPosts: Post[] = myPostsData?.posts ?? [];

  const { data: nearbyData, error: nearbyError, isLoading: nearbyLoading } = useSWR(
    "/api/me/posts/nearby",
    (url) => fetch(url).then((r) => r.json())
  );
  const nearbyPosts: Post[] = nearbyData?.posts ?? [];
  const hasSubs = nearbyData?.reason !== "no_subscriptions";

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="rounded border border-gray-300 px-4 py-3 text-left hover:bg-blue-50 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">{item.title}</span>
                <span className="text-blue-500 text-xs">→</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Mani sludinājumi</h2>
          <p className="text-sm text-gray-600">Skatīt, rediģēt vai dzēst savus sludinājumus.</p>
        </div>
        {myPostsLoading && <p className="text-sm text-gray-600">Ielādē manus sludinājumus...</p>}
        {myPostsError && (
          <p className="text-sm text-red-600">
            Neizdevās ielādēt manus sludinājumus.{" "}
            <Link href="/me/posts" className="text-blue-600 underline">
              Atvērt lapu
            </Link>
          </p>
        )}
        {!myPostsLoading && !myPostsError && myPosts.length === 0 && (
          <p className="text-sm text-gray-700">
            Pagaidām nav sludinājumu.{" "}
            <Link href="/posts/new" className="text-blue-600 underline">
              Izveido pirmo.
            </Link>
          </p>
        )}
        {!myPostsLoading && !myPostsError && myPosts.length > 0 && (
          <div className="space-y-2">
            {myPosts.map((p) => (
              <div
                key={p.id}
                className="rounded border border-gray-200 p-3 text-sm text-gray-800 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{p.title || "Bez nosaukuma"}</span>
                  <span className="text-xs uppercase text-gray-500">
                    {statusLabels[p.status] ?? p.status}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  {(p.type === "lost" ? "Pazudis" : p.type === "found" ? "Atrasts" : p.type) || ""}
                  {p.category ? ` • ${p.category}` : ""}
                  {p.placeName ? ` • ${p.placeName}` : ""}
                  {p.createdAt ? ` • ${new Date(p.createdAt).toLocaleDateString()}` : ""}
                </div>
                <div className="flex gap-2">
                  <Link href={`/posts/${p.id}`} className="text-blue-600 hover:underline">
                    Skatīt
                  </Link>
                </div>
              </div>
            ))}
            {myPosts.length > 5 && (
              <Link href="/me/posts" className="text-sm text-blue-600 underline">
                Rādīt visus manus sludinājumus
              </Link>
            )}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Sludinājumi pēc manām paziņojumu zonām</h2>
          <p className="text-sm text-gray-600">
            Parāda pēdējos sludinājumus, kas ir tuvu tavām aktīvajām abonementu lokācijām.
          </p>
        </div>
        {!hasSubs && (
          <p className="text-sm text-gray-700">
            Nav aktīvu abonementu ar lokāciju.{" "}
            <Link href="/me/notifications" className="text-blue-600 underline">
              Atvērt paziņojumu iestatījumus
            </Link>
          </p>
        )}
        {hasSubs && nearbyLoading && <p className="text-sm text-gray-600">Ielādē tuvākos sludinājumus...</p>}
        {hasSubs && nearbyError && (
          <p className="text-sm text-red-600">
            Neizdevās ielādēt tuvākos sludinājumus.{" "}
            <Link href="/posts" className="text-blue-600 underline">
              Atvērt katalogu
            </Link>
          </p>
        )}
        {hasSubs && !nearbyLoading && !nearbyError && nearbyPosts.length === 0 && (
          <p className="text-sm text-gray-700">Pagaidām nav sludinājumu tavos rādiusos.</p>
        )}
        {hasSubs && !nearbyLoading && !nearbyError && nearbyPosts.length > 0 && (
          <div className="space-y-2">
            {nearbyPosts.map((p) => (
              <div
                key={p.id}
                className="rounded border border-gray-200 p-3 text-sm text-gray-800 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{p.title || "Bez nosaukuma"}</span>
                  <span className="text-xs uppercase text-gray-500">
                    {statusLabels[p.status] ?? p.status}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  {(p.type === "lost" ? "Pazudis" : p.type === "found" ? "Atrasts" : p.type) || ""}
                  {p.category ? ` • ${p.category}` : ""}
                  {p.placeName ? ` • ${p.placeName}` : ""}
                  {p.distanceKm != null ? ` • ~${p.distanceKm} km` : ""}
                  {p.createdAt ? ` • ${new Date(p.createdAt).toLocaleDateString()}` : ""}
                </div>
                <div className="flex gap-2">
                  <Link href={`/posts/${p.id}`} className="text-blue-600 hover:underline">
                    Skatīt
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
