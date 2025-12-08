"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

type PostItem = {
  id: string;
  title: string;
  type: string;
  category: string;
  placeName?: string | null;
  description?: string;
  photos?: string[];
  createdAt?: string | null;
};

type Option = { id: string; name: string };

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PostsList() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [category, setCategory] = useState("");
  const [place, setPlace] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (typeFilter) params.set("type", typeFilter);
    if (category) params.set("category", category);
    if (place) params.set("place", place);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [debouncedSearch, typeFilter, category, place]);

  const { data, error, isLoading, isValidating } = useSWR(
    `/api/public/posts${query}`,
    fetcher,
    { keepPreviousData: true }
  );

  const { data: categoriesData } = useSWR("/api/public/categories", fetcher);
  const { data: placesData } = useSWR("/api/public/places", fetcher);

  const categories: Option[] = categoriesData?.categories ?? [];
  const places: Option[] = placesData?.places ?? [];

  const posts: PostItem[] = data?.posts ?? [];
  const initialLoading = isLoading && !data;
  const searching = isValidating && !isLoading;
  const hasQuery = Boolean(debouncedSearch || typeFilter || category || place);
  const emptyState = !initialLoading && !searching && posts.length === 0;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-800">Search &amp; filter</p>
            <p className="text-xs text-gray-500">
              Meklē pēc nosaukuma vai apraksta un izvēlies kategoriju, statusu un vietu.
            </p>
          </div>
          <div className="flex w-full max-w-md items-center gap-2">
            <input
              id="post-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lost or found posts"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <label htmlFor="type-filter" className="text-xs font-semibold text-gray-700 uppercase">
              Status
            </label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="lost">Pazudis</option>
              <option value="found">Atrasts</option>
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="category-filter"
              className="text-xs font-semibold text-gray-700 uppercase"
            >
              Category
            </label>
            <select
              id="category-filter"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name.toLowerCase()}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="place-filter" className="text-xs font-semibold text-gray-700 uppercase">
              Place
            </label>
            <select
              id="place-filter"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All</option>
              {places.map((p) => (
                <option key={p.id} value={p.name.toLowerCase()}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {searching && (
          <p className="text-xs text-gray-500">{hasQuery ? "Searching..." : "Loading..."}</p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">Failed to load posts</p>}
      {initialLoading && <p className="text-sm text-gray-600">Loading...</p>}

      {emptyState ? (
        <p className="text-sm text-gray-600">
          {hasQuery ? "No posts match your filters." : "No posts yet."}
        </p>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <a
              key={p.id}
              href={`/posts/${p.id}`}
              className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-blue-300 transition md:flex-row md:items-center"
            >
              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">{p.title}</h3>
                <p className="text-xs text-gray-500">
                  {p.type === "lost" ? "Pazudis" : "Atrasts"} | {p.category}
                  {p.placeName && ` | ${p.placeName}`}
                  {p.createdAt && ` | ${new Date(p.createdAt).toLocaleDateString()}`}
                </p>
                {p.description && (
                  <p className="text-sm text-gray-700 line-clamp-2">{p.description}</p>
                )}
              </div>
              {p.photos?.length ? (
                <img
                  src={p.photos[0]}
                  alt="post"
                  className="h-24 w-32 rounded object-cover border border-gray-200"
                />
              ) : null}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
