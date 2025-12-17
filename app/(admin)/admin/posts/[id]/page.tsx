import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/server";
import PhotoGallery from "../../../../posts/[id]/PhotoGallery";
import LocationMap from "../../../../posts/[id]/LocationMap";
import { AdminActions } from "../../../../posts/[id]/AdminActions";
import { loadAllPhotosForPosts } from "@/lib/postPhotos";

type PageProps = {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

export const runtime = "nodejs";

export default async function AdminPostDetailPage({ params, searchParams }: PageProps) {
  const viewer = await getSessionUser();
  const isAdmin = viewer?.role?.toLowerCase?.() === "admin";
  if (!isAdmin) {
    notFound();
  }

  const from = typeof searchParams?.from === "string" ? searchParams.from : null;
  const backHref = from === "complaints" ? "/admin/complaints" : "/admin/posts";
  const backLabel =
    from === "complaints" ? "Atpakaļ uz sūdzību sarakstu" : "Atpakaļ uz sludinājumu sarakstu";
  const contextLabel = from === "complaints" ? "Admin · Sūdzības" : "Admin · Sludinājums";

  const snap = await adminDb.collection("posts").doc(params.id).get();
  if (!snap.exists) {
    notFound();
  }
  const data = snap.data() as any;

  let placeName: string | null = null;
  let geo: { lat: number; lng: number } | null = null;
  try {
    const placeSnap = await adminDb.collection("postsPlace").doc(params.id).get();
    const placeData = placeSnap.data() as any;
    const lat = Number(placeData?.lat ?? placeData?.geo?.lat);
    const lng = Number(placeData?.lng ?? placeData?.geo?.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      geo = { lat, lng };
    }
    if (placeData?.placeNamePlace) {
      placeName = placeData.placeNamePlace;
    }
  } catch {
    geo = null;
  }

  const photosMap = await loadAllPhotosForPosts([params.id]);
  const photos = photosMap.get(params.id)?.map((p) => p.url) ?? [];

  const post = {
    id: snap.id,
    title: data.title ?? "",
    type: data.type ?? "",
    status: data.status ?? "open",
    category: data.category ?? "",
    placeName: placeName ?? data.placeName ?? null,
    description: data.descriptionPosts ?? data.description ?? "",
    photos,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
    geo,
    ownerEmail: data.userEmail ?? null,
    ownerName: data.ownerName ?? null,
    ownerPhone: data.ownerPhone ?? null,
    privateNote: data.privateNote ?? "",
    blockedReason: data.blockedReason ?? null,
  };

  // Load complaints only when coming from complaints section
  let postComplaints: {
    id: string;
    reason?: string | null;
    createdAt?: string | null;
    reporterEmail?: string | null;
  }[] = [];
  if (from === "complaints") {
    try {
      const baseQuery = adminDb.collection("complaints").where("postId", "==", params.id);
      let complaintsSnap;
      try {
        complaintsSnap = await baseQuery.orderBy("createdAt", "desc").limit(20).get();
      } catch {
        complaintsSnap = await baseQuery.limit(20).get();
      }
      postComplaints = complaintsSnap.docs.map((d) => {
        const c = d.data() as any;
        return {
          id: d.id,
          reason: c?.reason ?? null,
          createdAt: c?.createdAt?.toDate ? c.createdAt.toDate().toISOString() : null,
          reporterEmail: c?.reporterEmail ?? null,
        };
      });
    } catch {
      postComplaints = [];
    }
  }

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    open: "bg-green-100 text-green-800 border-green-200",
    resolved: "bg-blue-100 text-blue-800 border-blue-200",
    hidden: "bg-amber-100 text-amber-800 border-amber-200",
    closed: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-gray-700">{contextLabel}</div>
          <Link
            href={backHref}
            className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
          >
            {backLabel}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${statusColors[post.status] ?? ""}`}>
            {post.status?.toUpperCase()}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-800">
            {post.type === "lost" ? "Pazudis" : "Atrasts"}
          </span>
          {post.createdAt && (
            <span className="rounded border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700">
              Izveidots: {new Date(post.createdAt).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {from === "complaints" && postComplaints.length > 0 && (
        <section className="space-y-2 rounded border border-amber-200 bg-amber-50 p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-amber-800">Sūdzības</h2>
            <span className="text-xs font-semibold text-amber-700">
              {postComplaints.length} {postComplaints.length === 1 ? "ieraksts" : "ieraksti"}
            </span>
          </div>
          <ul className="space-y-2">
            {postComplaints.map((c) => (
              <li
                key={c.id}
                className="rounded border border-amber-200 bg-white/60 px-3 py-2 text-xs text-amber-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-amber-800 font-semibold">
                  <span>{c.createdAt ? new Date(c.createdAt).toLocaleString() : "Nav datuma"}</span>
                  {c.reporterEmail && <span className="font-normal">Ziņotājs: {c.reporterEmail}</span>}
                </div>
                <div className="text-sm leading-relaxed mt-1">{c.reason || "Nav norādīts iemesls"}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <header className="border-b border-gray-200 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
            {post.category && <p className="text-sm text-gray-600 mt-1">{post.category}</p>}
          </div>
        </div>

        {post.photos.length > 0 && (
          <div className="pt-3">
            <PhotoGallery photos={post.photos} />
          </div>
        )}
      </header>

      {post.status === "hidden" && post.blockedReason && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Sludinājumu paslēpa administrators. Iemesls: {post.blockedReason}
        </div>
      )}

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Apraksts</h2>
        <p className="leading-relaxed text-gray-800 whitespace-pre-wrap">{post.description || "Nav apraksta."}</p>
      </section>

      {post.privateNote && (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Privāta piezīme</h2>
          <div className="rounded border border-gray-200 bg-yellow-50 p-3 text-sm text-gray-800">
            {post.privateNote}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Atrašanās vieta</h2>
        {post.geo ? (
          <div className="rounded border border-gray-200 bg-gray-50 p-3 text-gray-800">
            <LocationMap lat={Number(post.geo.lat)} lng={Number(post.geo.lng)} label={post.placeName || post.title} />
          </div>
        ) : (
          <p className="text-gray-700">Nav norādīta atrašanās vieta.</p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Īpašnieka informācija</h2>
        <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 space-y-1">
          {post.ownerName && (
            <div>
              <span className="font-semibold">Vārds:</span> {post.ownerName}
            </div>
          )}
          {post.ownerEmail && (
            <div>
              <span className="font-semibold">E-pasts:</span> {post.ownerEmail}
            </div>
          )}
          {post.ownerPhone && (
            <div>
              <span className="font-semibold">Tālrunis:</span> {post.ownerPhone}
            </div>
          )}
          {!post.ownerName && !post.ownerEmail && !post.ownerPhone && (
            <div className="text-gray-600">Īpašnieka dati nav norādīti.</div>
          )}
        </div>
      </section>

      <section className="space-y-3 rounded border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-gray-900">Moderācija</h2>
        <p className="text-sm text-gray-700">Apstipriniet, bloķējiet vai dzēsiet šo sludinājumu.</p>
        <AdminActions postId={post.id} status={post.status} blockedReason={post.blockedReason ?? ""} />
      </section>
    </main>
  );
}
