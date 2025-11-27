import type { Metadata } from "next";
import type { GeoPoint } from "@/types/post";

type PostDetail = {
  id: string;
  title: string;
  status: "open" | "resolved" | "closed";
  type: "lost" | "found";
  category: string;
  tags: string[];
  description: string;
  descriptionHidden?: boolean;
  placeName?: string;
  geo?: GeoPoint;
  photos: { id: string; url: string; alt?: string }[];
  createdAt: string;
  updatedAt: string;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
};

const mockPost: PostDetail = {
  id: "demo-123",
  title: "Black backpack near central park",
  status: "open",
  type: "lost",
  category: "bags",
  tags: ["backpack", "black", "laptop"],
  description:
    "Lost a black backpack with a laptop inside near the main entrance of the central park. Reward for return.",
  placeName: "Central Park main gate",
  geo: { lat: 55.751244, lng: 37.618423 },
  photos: [
    { id: "p1", url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083", alt: "Backpack" },
    { id: "p2", url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab", alt: "Zippers" },
  ],
  createdAt: "2025-11-20T10:15:00Z",
  updatedAt: "2025-11-22T14:45:00Z",
  userName: "Alex Doe",
  userEmail: "alex@example.com",
  userPhone: "+371 20000000",
};

export const metadata: Metadata = {
  title: "Post detail",
};

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const post = mockPost;

  const statusColors: Record<PostDetail["status"], string> = {
    open: "bg-green-100 text-green-800 border-green-200",
    resolved: "bg-blue-100 text-blue-800 border-blue-200",
    closed: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header className="space-y-3 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${statusColors[post.status]}`}>
            {post.status.toUpperCase()}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-800">
            {post.type === "lost" ? "Lost" : "Found"}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
        <div className="flex flex-wrap gap-3 text-sm text-gray-700">
          <span className="rounded border border-gray-200 bg-gray-50 px-3 py-1 font-medium">
            Category: {post.category}
          </span>
          <span className="rounded border border-gray-200 bg-gray-50 px-3 py-1 font-medium">
            Tags: {post.tags.join(", ")}
          </span>
          <span className="rounded border border-gray-200 bg-gray-50 px-3 py-1">
            Created: {new Date(post.createdAt).toLocaleString()}
          </span>
          <span className="rounded border border-gray-200 bg-gray-50 px-3 py-1">
            Updated: {new Date(post.updatedAt).toLocaleString()}
          </span>
        </div>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Description</h2>
        <p className="leading-relaxed text-gray-800">{post.description}</p>
        {post.descriptionHidden && (
          <p className="text-sm text-amber-700">Some details are hidden and only visible to the author.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-900">Photos</h2>
        {post.photos.length === 0 ? (
          <p className="text-gray-700">No photos attached.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {post.photos.map((photo) => (
              <figure key={photo.id} className="overflow-hidden rounded-lg border border-gray-200">
                <img src={photo.url} alt={photo.alt ?? "Post photo"} className="h-56 w-full object-cover" />
                {photo.alt && <figcaption className="p-2 text-sm text-gray-700">{photo.alt}</figcaption>}
              </figure>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Location</h2>
        {post.placeName ? (
          <div className="rounded border border-gray-200 bg-gray-50 p-3 text-gray-800">
            <div className="font-medium">Place: {post.placeName}</div>
            {post.geo ? (
              <div className="text-sm text-gray-700">
                Coordinates: {post.geo.lat.toFixed(5)}, {post.geo.lng.toFixed(5)}
              </div>
            ) : (
              <div className="text-sm text-gray-700">Coordinates not provided.</div>
            )}
          </div>
        ) : (
          <p className="text-gray-700">No location provided.</p>
        )}
        <div className="rounded border border-dashed border-gray-300 p-4 text-sm text-gray-600">
          Map placeholder. Integrate Google Maps here and place a marker at the coordinates when available.
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Contact</h2>
        <div className="rounded border border-gray-200 bg-gray-50 p-3 text-gray-800">
          <div className="font-medium">{post.userName ?? "Anonymous user"}</div>
          {post.userEmail && <div>Email: {post.userEmail}</div>}
          {post.userPhone && <div>Phone: {post.userPhone}</div>}
        </div>
      </section>
    </main>
  );
}
