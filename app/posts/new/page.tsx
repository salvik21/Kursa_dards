"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PostForm } from "@/components/PostForm";

export default function NewPostPage() {
  const router = useRouter();
  const initialValues = {
    title: "",
    type: "lost" as const,
    category: "",
    tags: [],
    placeName: "Nav vietas",
    description: "",
    photos: [],
    hiddenPhotos: [],
    hidePhotos: false,
    geo: null,
    showEmail: true,
    showPhone: false,
    privateNote: "",
  };

  const createPost = async (payload: any) => {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        photosHidden: payload.hidePhotos === true,
        hiddenPhotos: payload.hiddenPhotos ?? [],
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || "Neizdevās izveidot ierakstu");
    }
    router.push("/me");
  };

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Izveidot ierakstu</h1>
          <p className="text-sm text-gray-600">Aizpildiet laukus un iesniedziet.</p>
        </div>
        <Link href="/me" className="text-blue-600 hover:underline text-sm">
          Atpakaļ uz kontu
        </Link>
      </div>

      <PostForm mode="create" initialValues={initialValues} onSubmit={createPost} onCancelHref="/me" />
    </main>
  );
}
