"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PostForm } from "@/components/PostForm";

type PostType = "lost" | "found";

type PostPayload = {
  title: string;
  type: PostType;
  category: string;
  placeName: string;
  description: string;
  photos: string[];
  tags: string[];
  geo?: { lat: number; lng: number } | null;
};

export default function EditPostPage({ params }: { params: { id: string } }) {
  const [initialValues, setInitialValues] = useState<PostPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/posts/${params.id}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error || "Failed to load post");
        }
        setInitialValues({
          title: json.post.title ?? "",
          type: (json.post.type as PostType) ?? "lost",
          category: json.post.category ?? "",
          placeName: json.post.placeName ?? "No place",
          description: json.post.description ?? "",
          photos: json.post.photos ?? [],
          tags: json.post.tags ?? [],
          geo: json.post.geo ?? null,
        });
      } catch (err: any) {
        setError(err?.message || "Failed to load post");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  const updatePost = async (payload: any) => {
    const res = await fetch(`/api/posts/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || "Failed to update post");
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-gray-700">Loading...</p>
      </main>
    );
  }

  if (error || !initialValues) {
    return (
      <main className="mx-auto max-w-3xl p-6 space-y-4">
        <p className="text-sm text-red-600">{error || "Failed to load post"}</p>
        <Link href="/" className="text-blue-600 hover:underline text-sm">
          Back to home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit post</h1>
          <p className="text-sm text-gray-600">Update your post details and save.</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/posts/${params.id}`} className="text-blue-600 hover:underline text-sm">
            View post
          </Link>
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            Back to home
          </Link>
        </div>
      </div>

      <PostForm mode="edit" initialValues={initialValues} onSubmit={updatePost} onCancelHref={`/posts/${params.id}`} />
    </main>
  );
}
