"use client";

import Link from "next/link";
import { PostForm } from "@/components/PostForm";

export default function NewPostPage() {
  const initialValues = {
    title: "",
    type: "lost" as const,
    category: "",
    tags: [],
    placeName: "No place",
    description: "",
    photos: [],
    geo: null,
  };

  const createPost = async (payload: any) => {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || "Failed to create post");
    }
  };

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create a post</h1>
          <p className="text-sm text-gray-600">Fill in the fields below and submit.</p>
        </div>
        <Link href="/me" className="text-blue-600 hover:underline text-sm">
          Back to account
        </Link>
      </div>

      <PostForm mode="create" initialValues={initialValues} onSubmit={createPost} onCancelHref="/me" />
    </main>
  );
}
