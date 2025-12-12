import type { Option } from "@/components/post-form/types";

export async function fetchTags(): Promise<string[]> {
  try {
    const res = await fetch("/api/public/tags", { cache: "no-store" });
    if (!res.ok) throw new Error("failed");
    const data = await res.json();
    return data?.tags?.map((t: any) => t.name).filter(Boolean) ?? [];
  } catch {
    return [];
  }
}

export async function fetchCategories(): Promise<Option[]> {
  try {
    const res = await fetch("/api/public/categories", { cache: "no-store" });
    if (!res.ok) throw new Error("failed");
    const data = await res.json();
    return (data?.categories ?? []).map((c: any) => ({ id: c.id, name: c.name }));
  } catch {
    return [];
  }
}

export async function fetchPlaces(): Promise<Option[]> {
  try {
    const res = await fetch("/api/public/places", { cache: "no-store" });
    if (!res.ok) throw new Error("failed");
    const data = await res.json();
    return [
      { id: "no-place", name: "Nav vietas" },
      ...((data?.places ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        lat: typeof p.lat === "number" ? p.lat : undefined,
        lng: typeof p.lng === "number" ? p.lng : undefined,
      })) as Option[]),
    ];
  } catch {
    return [];
  }
}
