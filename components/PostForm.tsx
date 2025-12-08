"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/maps";

type PostType = "lost" | "found";
type LocationMode = "list" | "address" | "map";

type PostFormValues = {
  title: string;
  type: PostType;
  category: string;
  tags: string[];
  placeName: string;
  description: string;
  photos: string[];
  geo?: { lat: number; lng: number } | null;
};

type Option = { id: string; name: string };

type PostFormProps = {
  mode: "create" | "edit";
  initialValues: PostFormValues;
  onSubmit: (payload: PostFormValues & { geo?: { lat: number; lng: number } | null }) => Promise<void>;
  onCancelHref: string;
};

const defaultTagOptions = ["Black", "Blue", "Wallet", "Phone", "Laptop", "Keys", "ID card", "Passport", "Jewelry"];
const defaultPlaceOptions = ["No place", "Central Park", "Main Station", "City Mall", "University", "Office", "Other"];

function MapPicker({
  lat,
  lng,
  onChange,
}: {
  lat: string;
  lng: string;
  onChange: (lat: string, lng: string) => void;
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    async function initMap() {
      try {
        const gm = await loadGoogleMaps();
        if (cancelled || !mapRef.current) return;
        const initial = lat && lng ? { lat: Number(lat), lng: Number(lng) } : { lat: 56.9496, lng: 24.1052 }; // Riga
        const map = new gm.Map(mapRef.current, { center: initial, zoom: 11 });
        mapInstance.current = map;
        const marker = new gm.Marker({ position: initial, map, draggable: true });
        markerRef.current = marker;

        const update = (pos: google.maps.LatLng) => {
          onChange(pos.lat().toString(), pos.lng().toString());
        };

        marker.addListener("dragend", () => {
          const pos = marker.getPosition();
          if (pos) update(pos);
        });

        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng || !markerRef.current) return;
          markerRef.current.setPosition(e.latLng);
          update(e.latLng);
        });
      } catch (error) {
        console.error("Map load error", error);
      }
    }
    initMap();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  useEffect(() => {
    if (!mapInstance.current || !markerRef.current) return;
    if (lat && lng) {
      const position = { lat: Number(lat), lng: Number(lng) };
      markerRef.current.setPosition(position);
      mapInstance.current.setCenter(position);
    }
  }, [lat, lng]);

  if (!mounted) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-800">Location on map</label>
        <div className="h-64 w-full rounded border border-gray-300" role="presentation" />
        <p className="text-xs text-gray-600">Click on the map or drag the marker to set coordinates.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-800">Location on map</label>
      <div ref={mapRef} className="h-64 w-full rounded border border-gray-300" role="presentation" />
      <p className="text-xs text-gray-600">Click on the map or drag the marker to set coordinates.</p>
    </div>
  );
}

function PhotoUploader({
  value,
  onChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/upload-photo", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok || !json.url) {
          throw new Error(json?.error || "Upload failed");
        }
        newUrls.push(json.url);
      }
      const combined = [...value, ...newUrls].slice(0, 5);
      onChange(combined);
    } catch (err: any) {
      setError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (url: string) => {
    onChange(value.filter((u) => u !== url));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-800">Photos</label>
        <span className="text-xs text-gray-500">Max 5</span>
      </div>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        disabled={uploading}
        className="block w-full text-sm text-gray-700 file:mr-3 file:rounded file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700 disabled:opacity-60"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {value.map((url) => (
          <div key={url} className="relative overflow-hidden rounded border border-gray-200">
            <img src={url} alt="uploaded" className="h-28 w-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(url)}
              className="absolute right-1 top-1 rounded bg-white/80 px-2 py-1 text-xs font-semibold text-red-600 shadow"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      {uploading && <p className="text-sm text-gray-600">Uploading...</p>}
    </div>
  );
}

export function PostForm({ mode, initialValues, onSubmit, onCancelHref }: PostFormProps) {
  const [values, setValues] = useState<PostFormValues>(initialValues);
  const [locationMode, setLocationMode] = useState<LocationMode>("list");
  const [availableTags, setAvailableTags] = useState<string[]>(defaultTagOptions);
  const [availableCategories, setAvailableCategories] = useState<Option[]>([]);
  const [availablePlaces, setAvailablePlaces] = useState<Option[]>(defaultPlaceOptions.map((p, i) => ({ id: `p-${i}`, name: p })));
  const [addressStreet, setAddressStreet] = useState("");
  const [addressHouse, setAddressHouse] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressPostal, setAddressPostal] = useState("");
  const [lat, setLat] = useState(values.geo?.lat ? String(values.geo.lat) : "");
  const [lng, setLng] = useState(values.geo?.lng ? String(values.geo.lng) : "");
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ title?: boolean; category?: boolean; description?: boolean }>({});

  // Initialize location mode from initial values
  useEffect(() => {
    let mode: LocationMode = "list";
    if (values.geo?.lat && values.geo?.lng) {
      mode = "map";
    } else if (values.placeName) {
      const inList = availablePlaces.some((p) => p.name === values.placeName);
      mode = inList ? "list" : "address";
      if (!inList) {
        setAddressStreet(values.placeName);
      }
    }
    setLocationMode(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load tags/categories/places
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch("/api/public/tags", { cache: "no-store" });
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        const names: string[] = data?.tags?.map((t: any) => t.name).filter(Boolean) ?? [];
        if (names.length) setAvailableTags(names);
      } catch {
        // fallback defaults
      }
    };
    fetchTags();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/public/categories", { cache: "no-store" });
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        const options: Option[] = (data?.categories ?? []).map((c: any) => ({ id: c.id, name: c.name }));
        if (options.length) {
          setAvailableCategories(options);
        }
      } catch {
        // keep empty
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const res = await fetch("/api/public/places", { cache: "no-store" });
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        const options: Option[] = [{ id: "no-place", name: "No place" }, ...(data?.places ?? [])];
        setAvailablePlaces(options);
        if (!values.placeName) {
          setValues((prev) => ({ ...prev, placeName: options[0]?.name ?? "No place" }));
        }
      } catch {
        // keep defaults
      }
    };
    fetchPlaces();
  }, [values.placeName]);

  const placeOptions = useMemo(() => availablePlaces, [availablePlaces]);

  const updateValue = <K extends keyof PostFormValues>(key: K, value: PostFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const toggleTag = (tag: string) => {
    setValues((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  };

  const validateDetails = () => {
    const errs = {
      title: !values.title.trim(),
      category: !values.category.trim(),
      description: !values.description.trim(),
    };
    setFieldErrors(errs);
    if (errs.title || errs.category || errs.description) {
      setMessage("Please fill required fields: title, category, description.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 0 && !validateDetails()) return;
    setMessage(null);
    setStep((prev) => Math.min(prev + 1, 2) as 0 | 1 | 2);
  };

  const handlePrev = () => {
    setMessage(null);
    setStep((prev) => Math.max(prev - 1, 0) as 0 | 1 | 2);
  };

  const handleSubmit = async () => {
    if (!validateDetails()) {
      setStep(0);
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const addressString =
        [addressStreet, addressHouse, addressCity, addressPostal].filter(Boolean).join(", ") || "";
      const finalPlace =
        locationMode === "address"
          ? addressString
          : locationMode === "map"
            ? values.placeName
            : values.placeName;
      const normalizedPlace = finalPlace && finalPlace !== "No place" ? finalPlace.trim() : "";
      const geoPayload =
        locationMode === "map" && lat && lng
          ? { lat: Number(lat), lng: Number(lng) }
          : null;

      await onSubmit({
        ...values,
        placeName: normalizedPlace,
        geo: geoPayload,
      });
      setMessage(mode === "create" ? "Post created." : "Post updated.");
    } catch (err: any) {
      setError(err?.message || "Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
        <span className={step === 0 ? "text-blue-600" : "text-gray-500"}>1. Details</span>
        <span className="text-gray-300">/</span>
        <span className={step === 1 ? "text-blue-600" : "text-gray-500"}>2. Location</span>
        <span className="text-gray-300">/</span>
        <span className={step === 2 ? "text-blue-600" : "text-gray-500"}>3. Photos</span>
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">Title *</label>
            <input
              value={values.title}
              onChange={(e) => updateValue("title", e.target.value)}
              className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-1 ${
                fieldErrors.title
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              }`}
              placeholder="Lost black backpack near park"
            />
            {fieldErrors.title && <p className="text-xs text-red-600">Title is required.</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800">Type *</label>
              <select
                value={values.type}
                onChange={(e) => updateValue("type", e.target.value as PostType)}
                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="lost">Pazudis</option>
                <option value="found">Atrasts</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800">Category *</label>
              <select
                value={values.category}
                onChange={(e) => updateValue("category", e.target.value)}
                className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-1 ${
                  fieldErrors.category
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                }`}
              >
                <option value="">Choose category</option>
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              {fieldErrors.category && <p className="text-xs text-red-600">Category is required.</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800">Tags (double-click to add/remove)</label>
              <div className="flex flex-wrap gap-2 rounded border border-gray-300 p-3">
                {availableTags.map((t) => {
                  const active = values.tags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onDoubleClick={() => toggleTag(t)}
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        active
                          ? "bg-blue-600 text-white border border-blue-600"
                          : "bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200"
                      }`}
                      title="Double-click to toggle"
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
              {values.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {values.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-800 hover:bg-gray-100"
                    >
                      <span>{tag}</span>
                      <span className="text-gray-500">x</span>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-600">Double-click a tag to add/remove it.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">Description *</label>
            <textarea
              value={values.description}
              onChange={(e) => updateValue("description", e.target.value)}
              rows={4}
              className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-1 ${
                fieldErrors.description
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              }`}
              placeholder="Describe what was lost/found, where, when, and identifying details."
            />
            {fieldErrors.description && <p className="text-xs text-red-600">Description is required.</p>}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">How to set location?</label>
            <div className="flex flex-wrap gap-3 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="loc-mode"
                  checked={locationMode === "list"}
                  onChange={() => setLocationMode("list")}
                />
                Choose from list
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="loc-mode"
                  checked={locationMode === "address"}
                  onChange={() => setLocationMode("address")}
                />
                Enter address
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="loc-mode"
                  checked={locationMode === "map"}
                  onChange={() => setLocationMode("map")}
                />
                Pick on map
              </label>
            </div>
          </div>

          {locationMode === "list" && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800">Place</label>
              <select
                value={values.placeName}
                onChange={(e) => updateValue("placeName", e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {placeOptions.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600">Select a preset place or choose "No place".</p>
            </div>
          )}

          {locationMode === "address" && (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-800">Street *</label>
                  <input
                    value={addressStreet}
                    onChange={(e) => setAddressStreet(e.target.value)}
                    placeholder="Brivibas iela"
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-800">House / apartment</label>
                  <input
                    value={addressHouse}
                    onChange={(e) => setAddressHouse(e.target.value)}
                    placeholder="10-15"
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-800">City *</label>
                  <input
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    placeholder="Riga"
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-800">Postal code</label>
                  <input
                    value={addressPostal}
                    onChange={(e) => setAddressPostal(e.target.value)}
                    placeholder="LV-1010"
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-600">
                Will be saved as text without coordinates. For precise alerts, choose "Pick on map".
              </p>
            </div>
          )}

          {locationMode === "map" && (
            <div className="space-y-4">
              <MapPicker
                lat={lat}
                lng={lng}
                onChange={(newLat, newLng) => {
                  setLat(newLat);
                  setLng(newLng);
                }}
              />
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-800">Place name (optional)</label>
                <input
                  value={values.placeName}
                  onChange={(e) => updateValue("placeName", e.target.value)}
                  placeholder="e.g., Park entrance"
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {step === 2 && <PhotoUploader value={values.photos} onChange={(photos) => updateValue("photos", photos)} />}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 0}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Previous
          </button>
          {step < 2 && (
            <button
              type="button"
              onClick={handleNext}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition"
            >
              Next
            </button>
          )}
        </div>
        {step === 2 && (
          <div className="flex gap-2">
            <a
              href={onCancelHref}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
            >
              Cancel
            </a>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition disabled:opacity-60"
            >
              {saving ? "Saving..." : mode === "create" ? "Create post" : "Save changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
