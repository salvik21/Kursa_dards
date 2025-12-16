"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PostForm } from "@/components/PostForm";
import type { PostFormValues } from "@/components/post-form/types";

type PostType = "lost" | "found";

export default function EditPostPage({ params }: { params: { id: string } }) {
  const [initialValues, setInitialValues] = useState<PostFormValues | null>(null);
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
          throw new Error(json?.error || "Neizdevās ielādēt ierakstu");
        }
        if (json.post?.status === "hidden") {
          const reason = json.post?.blockedReason ? ` Iemesls: ${json.post.blockedReason}.` : "";
          setError(`Šis sludinājums ir bloķēts un to var tikai dzēst.${reason}`);
          setLoading(false);
          return;
        }
        const tagList =
          (Array.isArray(json.post.tagNames) && json.post.tagNames.length ? json.post.tagNames : json.post.tags) ??
          [];
        const tags = Array.from(new Set(tagList.filter(Boolean)));
        setInitialValues({
          title: json.post.title ?? "",
          type: (json.post.type as PostType) ?? "lost",
          category: json.post.categoryId ?? json.post.category ?? "",
          placeName: json.post.placeName ? (json.post.placeName === "No place" ? "Nav vietas" : json.post.placeName) : "Nav vietas",
          description: json.post.description ?? "",
          photos: json.post.photos ?? [],
          hiddenPhotos: json.post.hiddenPhotos ?? [],
          hidePhotos: json.post.photosHidden === true,
          tags,
          geo: json.post.geo ?? null,
          showEmail: json.post.showEmail !== false,
          showPhone: !!json.post.showPhone,
          privateNote: json.post.privateNote ?? "",
        });
      } catch (err: any) {
        setError(err?.message || "Neizdevās ielādēt ierakstu");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  const updatePost = async (payload: PostFormValues) => {
    const res = await fetch(`/api/posts/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        photosHidden: payload.hidePhotos === true,
        hiddenPhotos: payload.hiddenPhotos ?? [],
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || "Neizdevās atjaunināt ierakstu");
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-gray-700">Ielādē...</p>
      </main>
    );
  }

  if (error || !initialValues) {
    return (
      <main className="mx-auto max-w-3xl p-6 space-y-4">
        <p className="text-sm text-red-600">{error || "Neizdevās ielādēt ierakstu"}</p>
        <Link href="/me/posts" className="text-blue-600 hover:underline text-sm">
          Atpakaļ uz “Mani sludinājumi”
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rediģēt ierakstu</h1>
            <p className="text-sm text-gray-600">Atjaunojiet ieraksta informāciju un saglabājiet.</p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/posts/${params.id}`}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Skatīt ierakstu
            </Link>
            <Link
              href="/"
              className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
            >
              Atpakaļ uz sākumlapu
            </Link>
          </div>
        </div>

      <PostForm mode="edit" initialValues={initialValues} onSubmit={updatePost} onCancelHref={`/posts/${params.id}`} />
    </main>
  );
}
