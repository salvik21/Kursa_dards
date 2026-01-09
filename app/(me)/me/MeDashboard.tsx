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
    title: "Izveidot jaunu sludinajumu",
    description: "Pievieno jaunu pazudusu vai atrastu prieksmetu ar foto un aprakstu.",
    href: "/posts/new",
  },
  {
    id: "posts",
    title: "Mani sludinajumi",
    description: "Skatit, rediget vai dzest savus sludinajumus.",
    href: "/me/posts",
  },
  {
    id: "admin",
    title: "Administratora panelis",
    description: "Moderet sludinajumus, parvaldit lietotajus, birkas, vietas un statistiku.",
    href: "/admin",
    onlyAdmin: true,
  },
  {
    id: "profile",
    title: "Profils un kontakti",
    description: "Atjauno kontaktinformaciju un konta detalas.",
    href: "/me/profile",
  },
  {
    id: "notifications",
    title: "Pazinojumu iestatijumi",
    description: "Parvaldi abonementus un attalumus, par kuriem sanem pazinojumus.",
    href: "/me/notifications",
  },
];

const statusLabels: Record<string, string> = {
  pending: "Gaida apstiprinajumu",
  open: "Atverts",
  resolved: "Atrisinats",
  hidden: "Paslepts",
  closed: "Slegts",
};

export default function MeDashboard({ user }: { user: User }) {
  const items = useMemo(
    () => ACTIONS.filter((a) =>!a.onlyAdmin || user.role === "admin"),
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
                <span className="text-blue-500 text-xs">&rarr;</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Mani sludinajumi</h2>
          <p className="text-sm text-gray-600">Skatit, rediget vai dzest savus sludinajumus.</p>
        </div>
        {myPostsLoading && <p className="text-sm text-gray-600">Ielade manus sludinajumus...</p>}
        {myPostsError && (
          <p className="text-sm text-red-600">
            Neizdevas ieladet manus sludinajumus.{" "}
            <Link href="/me/posts" className="text-blue-600 underline">
              Atvert lapu
            </Link>
          </p>
        )}
        {!myPostsLoading && !myPostsError && myPosts.length === 0 && (
          <p className="text-sm text-gray-700">
            Pagaidam nav sludinajumu.{" "}
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
                  {p.category ? ` - ${p.category}` : ""}
                  {p.placeName ? ` - ${p.placeName}` : ""}
                  {p.createdAt ? ` - ${new Date(p.createdAt).toLocaleDateString()}` : ""}
                </div>
                <div className="flex gap-2">
                  <Link href={`/posts/${p.id}`} className="text-blue-600 hover:underline">
                    Skatit
                  </Link>
                </div>
              </div>
            ))}
            {myPosts.length > 5 && (
              <Link href="/me/posts" className="text-sm text-blue-600 underline">
                Radit visus manus sludinajumus
              </Link>
            )}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Sludinajumi pec manam pazinojumu zonam</h2>
          <p className="text-sm text-gray-600">
            Parada pedejos sludinajumus, kas ir tuvu tavam aktivajam abonementu lokacijam.
          </p>
        </div>
        {!hasSubs && (
          <p className="text-sm text-gray-700">
            Nav aktivu abonementu ar lokaciju.{" "}
            <Link href="/me/notifications" className="text-blue-600 underline">
              Atvert pazinojumu iestatijumus
            </Link>
          </p>
        )}
        {hasSubs && nearbyLoading && <p className="text-sm text-gray-600">Ielade tuvakos sludinajumus...</p>}
        {hasSubs && nearbyError && (
          <p className="text-sm text-red-600">
            Neizdevas ieladet tuvakos sludinajumus.{" "}
            <Link href="/posts" className="text-blue-600 underline">
              Atvert katalogu
            </Link>
          </p>
        )}
        {hasSubs && !nearbyLoading && !nearbyError && nearbyPosts.length === 0 && (
          <p className="text-sm text-gray-700">Pagaidam nav sludinajumu tavos radiusos.</p>
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
                  {p.category ? ` - ${p.category}` : ""}
                  {p.placeName ? ` - ${p.placeName}` : ""}
                  {p.distanceKm != null ? ` - ~${p.distanceKm} km` : ""}
                  {p.createdAt ? ` - ${new Date(p.createdAt).toLocaleDateString()}` : ""}
                </div>
                <div className="flex gap-2">
                  <Link href={`/posts/${p.id}`} className="text-blue-600 hover:underline">
                    Skatit
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
