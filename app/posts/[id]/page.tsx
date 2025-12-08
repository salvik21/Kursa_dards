import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { adminDb } from "@/lib/firebase/admin";
import ContactOwner from "./ContactOwner";
import SubmitComplaint from "./SubmitComplaint";
import LocationMap from "./LocationMap";
import PhotoGallery from "./PhotoGallery";
import { getSessionUser } from "@/lib/auth/server";

type PageProps = {
  params: { id: string };
};

export const runtime = "nodejs";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const snap = await adminDb.collection("posts").doc(params.id).get();
  const data = snap.data() as any;
  const title = data?.title ?? "Post";
  return { title };
}

export default async function PostDetailPage({ params }: PageProps) {
  const viewer = await getSessionUser();
  const snap = await adminDb.collection("posts").doc(params.id).get();
  if (!snap.exists) {
    notFound();
  }
  const data = snap.data() as any;
  let ownerEmail = data?.ownerEmail || data?.userEmail || null;
  let ownerName: string | null = null;
  let ownerPhone: string | null = null;
  if (!ownerEmail && data?.userId) {
    try {
      const userSnap = await adminDb.collection("users").doc(data.userId).get();
      const userData = userSnap.data() as any;
      if (userData?.email) {
        ownerEmail = userData.email;
      }
      ownerName = userData?.displayName ?? userData?.name ?? null;
      ownerPhone = userData?.phone ?? null;
    } catch (e) {
      // ignore lookup failure
    }
  }
  const post = {
    id: snap.id,
    title: data.title ?? "",
    type: data.type ?? "",
    status: data.status ?? "open",
    category: data.category ?? "",
    tags: data.tags ?? [],
    placeName: data.placeName ?? null,
    geo: data.geo ?? null,
    description: data.description ?? "",
    photos: data.photos ?? [],
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
    ownerEmail,
    ownerName,
    ownerPhone,
    blockedReason: data.blockedReason ?? null,
  };
  const canEdit = viewer && (viewer.role === "admin" || viewer.uid === data.userId);

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
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to home
        </a>
      </div>

      <header className="space-y-3 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${statusColors[post.status] ?? ""}`}>
            {post.status?.toUpperCase()}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-800">
            {post.type === "lost" ? "Lost" : "Found"}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
        {post.createdAt && (
          <div className="flex flex-wrap gap-3 text-sm text-gray-700">
            <span className="rounded border border-gray-200 bg-gray-50 px-3 py-1">
              Created: {new Date(post.createdAt).toLocaleString()}
            </span>
          </div>
        )}
        {canEdit && (
          <div>
            <a
              href={`/posts/${post.id}/edit`}
              className="inline-flex items-center rounded border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              Edit post
            </a>
          </div>
        )}
      </header>

      {post.status === "hidden" && post.blockedReason && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          This post is hidden by an administrator. Reason: {post.blockedReason}
        </div>
      )}

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Description</h2>
        <p className="leading-relaxed text-gray-800 whitespace-pre-wrap">{post.description}</p>
      </section>

      {(post.ownerName || post.ownerEmail || post.ownerPhone) && (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Owner info</h2>
          <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 space-y-1">
            {post.ownerName && <div><span className="font-semibold">Name:</span> {post.ownerName}</div>}
            {post.ownerEmail && <div><span className="font-semibold">Email:</span> {post.ownerEmail}</div>}
            {post.ownerPhone && <div><span className="font-semibold">Phone:</span> {post.ownerPhone}</div>}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-900">Photos</h2>
        {post.photos.length === 0 ? (
          <p className="text-gray-700">No photos attached.</p>
        ) : (
          <PhotoGallery photos={post.photos} />
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Location</h2>
        {post.placeName ? (
          <div className="rounded border border-gray-200 bg-gray-50 p-3 text-gray-800">
            <div className="font-medium">Place: {post.placeName}</div>
            {post.geo ? (
              <div className="text-sm text-gray-700">
                Coordinates: {post.geo.lat?.toFixed?.(5) ?? post.geo.lat}, {post.geo.lng?.toFixed?.(5) ?? post.geo.lng}
              </div>
            ) : (
              <div className="text-sm text-gray-700">Coordinates not provided.</div>
            )}
            {post.geo && (
              <LocationMap
                lat={Number(post.geo.lat)}
                lng={Number(post.geo.lng)}
                label={post.placeName || post.title}
              />
            )}
          </div>
        ) : (
          <p className="text-gray-700">No location provided.</p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Contact owner</h2>
        <ContactOwner postId={post.id} ownerEmail={post.ownerEmail} />
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Пожаловаться</h2>
        <SubmitComplaint postId={post.id} />
      </section>
    </main>
  );
}
