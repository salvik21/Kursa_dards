"use client";

import { useEffect, useState, FormEvent, useRef } from "react";
import Link from "next/link";
import { AdminBackButton } from "@/components/AdminBackButton";
import { loadGoogleMaps } from "@/lib/maps";

type Place = { id: string; name: string; lat?: number; lng?: number };

export default function PlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [name, setName] = useState("");
  // Default to Riga, Latvia
  const defaultLat = "56.9496";
  const defaultLng = "24.1052";
  const [lat, setLat] = useState(defaultLat);
  const [lng, setLng] = useState(defaultLng);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPlaces = async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/places", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load places");
      const data = await res.json();
      setPlaces(data.places ?? []);
    } catch (err: any) {
      setError(err?.message || "Failed to load places");
    }
  };

  useEffect(() => {
    loadPlaces();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!name.trim() || !lat.trim() || !lng.trim()) {
      setError("Nepieciešams vietas nosaukums un koordinātas");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          lat: Number(lat),
          lng: Number(lng),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Neizdevās izveidot vietu");
      }
      setName("");
      setLat(defaultLat);
      setLng(defaultLng);
      setMessage("Vieta izveidota");
      loadPlaces();
    } catch (err: any) {
      setError(err?.message || "Neizdevās izveidot vietu");
    } finally {
      setLoading(false);
    }
  };

  const removePlace = async (id: string) => {
    setError(null);
    try {
      const res = await fetch("/api/admin/places", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Neizdevās dzēst vietu");
      }
      setMessage("Vieta dzēsta");
      loadPlaces();
    } catch (err: any) {
      setError(err?.message || "Neizdevās dzēst vietu");
    }
  };

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vietu pārvaldība</h1>
          <p className="text-sm text-gray-700">Administratori var pievienot vai noņemt iepriekš sagatavotus vietu nosaukumus.</p>
        </div>
        <AdminBackButton />
      </div>

      <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-800">Vietas nosaukums</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="piem., Centrālais parks, Galvenā stacija"
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">Platums</label>
            <input
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="56.9496"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">Garums</label>
            <input
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="24.1052"
            />
          </div>
        </div>
        <MapPicker
          lat={lat}
          lng={lng}
          onChange={(newLat, newLng) => {
            setLat(newLat);
            setLng(newLng);
          }}
        />
        {message && <p className="text-sm text-green-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white font-semibold shadow hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Saglabā..." : "Pievienot vietu"}
        </button>
      </form>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Esošās vietas</h2>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {places.length === 0 ? (
          <p className="text-sm text-gray-600">Vietas vēl nav pievienotas.</p>
        ) : (
          <ul className="space-y-2">
            {places.map((place) => (
              <li
                key={place.id}
                className="flex items-center justify-between rounded border border-gray-200 px-3 py-2 text-sm text-gray-800"
              >
                <span>
                  {place.name}
                  {place.lat != null && place.lng != null && (
                    <span className="text-xs text-gray-500">
                      {" "}
                      ({place.lat.toFixed(5)}, {place.lng.toFixed(5)})
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => removePlace(place.id)}
                  className="rounded bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  Dzēst
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

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
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function initMap() {
      if (mapInstance.current) return;
      try {
        const gm = await loadGoogleMaps();
        if (cancelled || !mapRef.current) return;
        const parsedLat = Number(lat);
        const parsedLng = Number(lng);
        const hasCoords = Number.isFinite(parsedLat) && Number.isFinite(parsedLng);
        const initial = hasCoords ? { lat: parsedLat, lng: parsedLng } : { lat: 56.9496, lng: 24.1052 }; // Riga
        const map = new gm.Map(mapRef.current, {
          center: initial,
          zoom: 11,
        });
        mapInstance.current = map;

        const marker = new gm.Marker({
          position: initial,
          map,
          draggable: true,
        });
        markerRef.current = marker;

        const update = (pos: google.maps.LatLng) => {
          onChangeRef.current?.(pos.lat().toString(), pos.lng().toString());
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
    if (mounted) {
      initMap();
    }
    return () => {
      cancelled = true;
    };
    // lat/lng are handled in the separate syncing effect below; avoid recreating map on every change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  useEffect(() => {
    if (!mapInstance.current || !markerRef.current) return;
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) return;
    const position = { lat: parsedLat, lng: parsedLng };
    markerRef.current.setPosition(position);
    mapInstance.current.setCenter(position);
  }, [lat, lng]);

  if (!mounted) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-800">Location on map</label>
        <div className="h-64 w-full rounded border border-gray-300" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-800">Atrašanās vieta kartē</label>
      <div ref={mapRef} className="h-64 w-full rounded border border-gray-300" role="presentation" />
      <p className="text-xs text-gray-600">Noklikšķiniet kartē vai pavelciet marķieri, lai norādītu koordinātas.</p>
    </div>
  );
}
