"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

type PostItem = {
  id: string;
  title: string;
  type: string;
  category: string;
  tags?: string[];
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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
    if (selectedTags.length) params.set("tags", selectedTags.join(","));
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [debouncedSearch, typeFilter, category, place, selectedTags]);

  const { data, error, isLoading, isValidating } = useSWR(
    `/api/public/posts${query}`,
    fetcher,
    { keepPreviousData: true }
  );

  const { data: categoriesData } = useSWR("/api/public/categories", fetcher);
  const { data: placesData } = useSWR("/api/public/places", fetcher);
  const { data: tagsData } = useSWR("/api/public/tags", fetcher);

  const categories: Option[] = useMemo(() => categoriesData?.categories ?? [], [categoriesData?.categories]);
  const tagOptions: Option[] = useMemo(
    () => tagsData?.tags?.map((t: any) => ({ id: t.id, name: t.name ?? t.id })) ?? [],
    [tagsData?.tags]
  );
  const tagLabelMap = useMemo(() => {
    const m = new Map<string, string>();
    tagOptions.forEach((t) => m.set(t.name.toLowerCase(), t.name));
    return m;
  }, [tagOptions]);
  const topTags = useMemo(() => tagOptions.slice(0, 10), [tagOptions]);
  const posts: PostItem[] = useMemo(() => data?.posts ?? [], [data?.posts]);
  const initialLoading = isLoading && !data;
  const searching = isValidating && !isLoading;
  const hasQuery = Boolean(debouncedSearch || typeFilter || category || place || selectedTags.length);
  const emptyState = !initialLoading && !searching && posts.length === 0;

  // Vietu saraksts no DB (ja ir places kolekcija) vai no pašiem sludinājumiem kā rezerves variants.
  const placeOptions: Option[] = useMemo(() => {
    const apiPlaces: Option[] = placesData?.places ?? [];
    if (apiPlaces.length) return apiPlaces;
    const set = new Set<string>();
    posts.forEach((p) => {
      const name = (p.placeName ?? "").trim();
      if (name) set.add(name);
    });
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, "lv"))
      .map((name) => ({ id: name, name }));
  }, [placesData, posts]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-800">Meklēšana un filtrēšana</p>
            <p className="text-xs text-gray-500">
              Meklē pēc nosaukuma vai apraksta un izvēlies kategoriju, statusu un vietu.
            </p>
          </div>
          <div className="flex w-full max-w-md items-center gap-2">
            <input
              id="post-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Meklē pazudušos vai atrastos sludinājumus"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Notīrīt
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <label htmlFor="type-filter" className="text-xs font-semibold text-gray-700 uppercase">
              Statuss
            </label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Visi</option>
              <option value="lost">Pazudis</option>
              <option value="found">Atrasts</option>
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="category-filter"
              className="text-xs font-semibold text-gray-700 uppercase"
            >
              Kategorija
            </label>
            <select
              id="category-filter"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Visas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name.toLowerCase()}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="place-filter" className="text-xs font-semibold text-gray-700 uppercase">
              Vieta
            </label>
            <select
              id="place-filter"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Visas</option>
              {placeOptions.map((p) => (
                <option key={p.id} value={p.name.toLowerCase()}>
                  {p.name}
                </option>
              ))}
              </select>
          </div>

        </div>

        <div className="space-y-1 md:ml-auto md:w-fit md:text-right">
          <label className="text-xs font-semibold text-gray-700 uppercase block">Tagi</label>
          <div className="flex flex-wrap gap-2 justify-start md:justify-end">
            {topTags.map((t) => {
              const token = t.name.toLowerCase();
              const checked = selectedTags.includes(token);
              return (
                <label
                  key={t.id}
                  className="flex items-center gap-1 text-xs text-gray-700 border border-gray-200 px-2 py-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setSelectedTags((prev) =>
                        e.target.checked ? [...prev, token] : prev.filter((v) => v !== token)
                      );
                    }}
                  />
                  #{t.name}
                </label>
              );
            })}
          </div>
          {selectedTags.length ? (
            <div className="flex flex-wrap gap-1 pt-1 justify-start md:justify-end">
              {selectedTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTags((prev) => prev.filter((v) => v !== t))}
                  className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 border border-blue-100"
                >
                  #{tagLabelMap.get(t) ?? t}
                  <span className="text-blue-500">✕</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {searching && (
          <p className="text-xs text-gray-500">{hasQuery ? "Meklē..." : "Ielādē..."}</p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">Neizdevās ielādēt sludinājumus</p>}
      {initialLoading && <p className="text-sm text-gray-600">Ielādē...</p>}

      {emptyState ? (
        <p className="text-sm text-gray-600">
          {hasQuery ? "Nav sludinājumu, kas atbilst filtriem." : "Pagaidām nav sludinājumu."}
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
                {p.tags?.length ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {p.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 border border-blue-100"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
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
