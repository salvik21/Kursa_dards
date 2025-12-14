import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { adminDb } from "@/lib/firebase/admin";
import ContactOwner from "./ContactOwner";
import SubmitComplaint from "./SubmitComplaint";
import LocationMap from "./LocationMap";
import PhotoGallery from "./PhotoGallery";
import { getSessionUser } from "@/lib/auth/server";
import { AdminActions } from "./AdminActions";
import { loadAllPhotosForPosts, loadVisiblePhotosForPosts } from "@/lib/postPhotos";

type PageProps = {
  params: { id: string };
};

export const runtime = "nodejs";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const snap = await adminDb.collection("posts").doc(params.id).get();
  const data = snap.data() as any;
  const title = data?.title ?? "Sludinājums";
  return { title };
}

export default async function PostDetailPage({ params }: PageProps) {
  const viewer = await getSessionUser();
  const isAdmin = viewer?.role?.toLowerCase?.() === "admin";
  const snap = await adminDb.collection("posts").doc(params.id).get();
  if (!snap.exists) {
    notFound();
  }

  const data = snap.data() as any;

  // Load geo from postsPlace collection (single doc keyed by postId)
  let geoFromPlace: { lat: number; lng: number } | null = null;
  let placeNameFromPlace: string | null = null;
  try {
    const placeSnap = await adminDb.collection("postsPlace").doc(params.id).get();
    const placeData = placeSnap.data() as any;
    if (placeData?.geo && Number.isFinite(placeData.geo.lat) && Number.isFinite(placeData.geo.lng)) {
      geoFromPlace = { lat: placeData.geo.lat, lng: placeData.geo.lng };
    }
    placeNameFromPlace = placeData?.placeNamePlace ?? null;
  } catch {
    geoFromPlace = null;
    placeNameFromPlace = null;
  }

  // Load tags for this post (fall back to stored tag names if lookup fails)
  let tagNames: string[] = [];
  try {
    const postTagsSnap = await adminDb.collection("postTags").where("postId", "==", params.id).get();
    const tagIds = postTagsSnap.docs.map((d) => (d.data() as any)?.tagId).filter(Boolean);
    if (tagIds.length) {
      const tagRefs = tagIds.map((id: string) => adminDb.collection("tags").doc(id));
      const tagDocs = await adminDb.getAll(...tagRefs);
      tagNames = tagDocs.map((doc) => ((doc.data() as any)?.name ?? "") as string).filter(Boolean);
      if (!tagNames.length) tagNames = tagIds;
    }
  } catch {
    tagNames = [];
  }

  const isOwner = viewer && viewer.uid === data.userId;
  const photosMap = isOwner || isAdmin
    ? await loadAllPhotosForPosts([params.id])
    : await loadVisiblePhotosForPosts([params.id]);
  const photoList = photosMap.get(params.id) ?? [];
  const hiddenPhotos = photoList.filter((p) => !p.visible).map((p) => p.url);
  const basePhotos: string[] = photoList.map((p) => p.url);
  const photosHidden = basePhotos.length > 0 && hiddenPhotos.length === basePhotos.length;
  // Hide per-photo flags for public visitors; owners/admins can see everything unless photosHidden hides all.
  const canSeeRestrictedPhotos = isAdmin || (viewer && viewer.uid === data.userId);
  const publicPhotos = basePhotos.filter((url) => !hiddenPhotos.includes(url));
  const photos =
    photosHidden && !canSeeRestrictedPhotos
      ? []
      : canSeeRestrictedPhotos
        ? basePhotos
        : publicPhotos;

  let ownerEmail = data?.userEmail || null;
  let ownerName: string | null = null;
  let ownerPhone: string | null = null;
  const canSeePrivate = isAdmin || (viewer && viewer.uid === data.userId);
  if (!ownerEmail && data?.userId) {
    try {
      const userSnap = await adminDb.collection("users").doc(data.userId).get();
      const userData = userSnap.data() as any;
      if (userData?.email) ownerEmail = userData.email;
      ownerName = userData?.displayName ?? userData?.name ?? null;
      ownerPhone = userData?.phone ?? null;
    } catch (e) {
     
    }
  }

  const post = {
    id: snap.id,
    title: data.title ?? "",
    type: data.type ?? "",
    status: data.status ?? "open",
    category: data.category ?? "",
    tags: tagNames.length ? tagNames : data.tagNames ?? data.tags ?? [],
    placeName: placeNameFromPlace ?? data.placeName ?? null,
    geo: geoFromPlace,
    description: data.descriptionPosts ?? data.description ?? "",
    photos,
    photosHidden,
    hiddenPhotos,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
    ownerEmail,
    ownerName,
    ownerPhone,
    showEmail: data.showEmail !== false,
    showPhone: !!data.showPhone,
    privateNote: data.privateNote ?? "",
    blockedReason: data.blockedReason ?? null,
  };
  const canEdit = viewer && viewer.uid === data.userId;

  let postComplaints: { id: string; reason?: string | null; createdAt?: string | null }[] = [];
  try {
    const baseQuery = adminDb.collection("complaints").where("postId", "==", params.id);
    let complaintsSnap;
    try {
      complaintsSnap = await baseQuery.orderBy("createdAt", "desc").limit(5).get();
    } catch {
      // Fallback without orderBy if composite index is missing
      complaintsSnap = await baseQuery.limit(5).get();
    }
    postComplaints = complaintsSnap.docs.map((d) => {
      const c = d.data() as any;
      return {
        id: d.id,
        reason: c?.reason ?? null,
        createdAt: c?.createdAt?.toDate ? c.createdAt.toDate().toISOString() : null,
      };
    });
  } catch {
    postComplaints = [];
  }

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    open: "bg-green-100 text-green-800 border-green-200",
    resolved: "bg-blue-100 text-blue-800 border-blue-200",
    hidden: "bg-amber-100 text-amber-800 border-amber-200",
    closed: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <div>
        <a
          href="/"
          className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
        >
          Atpakaļ uz sākumu
        </a>
      </div>

      <header className="border-b border-gray-200 pb-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${statusColors[post.status] ?? ""}`}>
              {post.status?.toUpperCase()}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-800">
              {post.type === "lost" ? "Pazudis" : "Atrasts"}
            </span>
          </div>

          <div className="flex items-start justify-between gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
            <div className="flex flex-col items-end gap-2">
              {post.createdAt && (
                <span className="rounded border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700">
                  Izveidots: {new Date(post.createdAt).toLocaleString()}
                </span>
              )}
              {canEdit && (
                <a
                  href={`/posts/${post.id}/edit`}
                  className="inline-flex items-center rounded border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                >
                  Rediģēt sludinājumu
                </a>
              )}
            </div>
          </div>

          {post.photos.length > 0 && (
            <div className="pt-2">
              <PhotoGallery photos={post.photos} />
            </div>
          )}
          {post.photosHidden && !post.photos.length && (
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              Foto pasl„"ptas p„"c autora izv„"les. Redzamas tikai „?pa…öniekam un administratoriem.
            </div>
          )}
        </div>
      </header>

      {post.status === "hidden" && post.blockedReason && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Sludinājumu paslēpa administrators. Iemesls: {post.blockedReason}
        </div>
      )}

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Apraksts</h2>
        <p className="leading-relaxed text-gray-800 whitespace-pre-wrap">{post.description}</p>
      </section>

      {post.tags?.length ? (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Tagi</h2>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 border border-blue-100"
              >
                #{tag}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {post.privateNote && canSeePrivate && (
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

      {(post.ownerName || (post.ownerEmail && post.showEmail) || (post.ownerPhone && post.showPhone)) && (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Īpašnieka informācija</h2>
          <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 space-y-1">
            {post.ownerName && (
              <div>
                <span className="font-semibold">Vārds:</span> {post.ownerName}
              </div>
            )}
            {post.ownerEmail && post.showEmail && (
              <div>
                <span className="font-semibold">E-pasts:</span> {post.ownerEmail}
              </div>
            )}
            {post.ownerPhone && post.showPhone && (
              <div>
                <span className="font-semibold">Tālrunis:</span> {post.ownerPhone}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Sazināties ar autoru</h2>
          <ContactOwner postId={post.id} ownerEmail={post.ownerEmail} />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Paziņot par sludinājumu</h2>
          <SubmitComplaint postId={post.id} />
        </div>
      </section>

    </main>
  );
}
