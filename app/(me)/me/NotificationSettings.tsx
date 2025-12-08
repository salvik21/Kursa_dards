"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/maps";

const radiusOptions = [
  { value: 0.5, label: "500 m" },
  { value: 1, label: "1 km" },
  { value: 2, label: "2 km" },
  { value: 3, label: "3 km" },
  { value: 4, label: "4 km" },
];

type Subscription = {
  id: string;
  name: string;
  enabled: boolean;
  radiusKm: number;
  location?: { geo?: { lat?: number; lng?: number }; address?: string | null } | null;
};

type SubscriptionResponse = {
  ok: boolean;
  subscriptions?: Subscription[];
  subscription?: Subscription | null;
  error?: string;
};

function MapPointPicker({
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

    async function init() {
      try {
        const gm = await loadGoogleMaps();
        if (cancelled || !mapRef.current) return;
        const center =
          lat && lng
            ? { lat: Number(lat), lng: Number(lng) }
            : { lat: 56.9496, lng: 24.1052 }; // default Riga center

        const map = new gm.Map(mapRef.current, { center, zoom: 11 });
        mapInstance.current = map;

        const marker = new gm.Marker({
          position: center,
          map,
          draggable: true,
        });
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
      } catch (err) {
        console.error("Map load failed", err);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
    // We only want to init once after mount to avoid map re-creation flicker
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

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-800">Pin on map</label>
      <div
        ref={mapRef}
        className="h-56 w-full rounded border border-gray-300"
        role="presentation"
      />
      <p className="text-xs text-gray-600">Click the map or drag the marker to set coordinates.</p>
    </div>
  );
}

export default function NotificationSettings() {
  const [list, setList] = useState<Subscription[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [radius, setRadius] = useState(1);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const addressInputRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/me/subscription", { cache: "no-store" });
      const json: SubscriptionResponse = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.error || "Failed to load settings");
      }
      const items = json.subscriptions ?? [];
      setList(items);
      if (items.length > 0) {
        selectForEdit(items[0]);
      } else {
        resetForm();
      }
    } catch (err: any) {
      setStatus(err?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let listener: google.maps.MapsEventListener | null = null;
    let autocomplete: google.maps.places.Autocomplete | null = null;
    const init = async () => {
      try {
        await loadGoogleMaps();
        if (!addressInputRef.current || !window.google?.maps?.places) return;
        autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
          fields: ["geometry", "formatted_address", "name"],
        });
        listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete?.getPlace();
          const loc = place?.geometry?.location;
          if (!loc) return;
          const nextLat = loc.lat();
          const nextLng = loc.lng();
          setLat(nextLat.toString());
          setLng(nextLng.toString());
          setAddress(place.formatted_address || place.name || addressInputRef.current?.value || "");
        });
      } catch (err) {
        // ignore autocomplete failure
      }
    };
    init();
    return () => {
      if (listener) {
        window.google.maps.event.removeListener(listener);
      }
    };
  }, []);

  const resetForm = () => {
    setCurrentId(null);
    setName("");
    setEnabled(false);
    setRadius(1);
    setLat("");
    setLng("");
    setAddress("");
  };

  const selectForEdit = (sub: Subscription) => {
    setCurrentId(sub.id);
    setName(sub.name);
    setEnabled(sub.enabled);
    setRadius(sub.radiusKm);
    const geo = sub.location?.geo;
    setLat(geo?.lat?.toString() ?? "");
    setLng(geo?.lng?.toString() ?? "");
    setAddress(sub.location?.address ?? "");
    setStatus(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    if (enabled && (!lat || !lng)) {
      setStatus("Please drop a pin on the map.");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        id: currentId || undefined,
        name: name.trim() || "Untitled",
        enabled,
        radiusKm: radius,
        location:
          lat && lng
            ? {
                geo: { lat: Number(lat), lng: Number(lng) },
                address: address.trim() || undefined,
              }
            : undefined,
      };

      const res = await fetch("/api/me/subscription", {
        method: currentId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json: SubscriptionResponse = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.error || "Failed to save settings");
      }
      if (json.subscription) {
        setList((prev) => {
          const exists = prev.find((s) => s.id === json.subscription!.id);
          if (exists) {
            return prev.map((s) => (s.id === json.subscription!.id ? json.subscription! : s));
          }
          return [...prev, json.subscription!];
        });
        setCurrentId(json.subscription.id);
      }
      setStatus(enabled ? "Email alerts saved." : "Alert saved (disabled).");
    } catch (err: any) {
      setStatus(err?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-6 rounded border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Nearby alerts</h2>
          <p className="text-sm text-gray-600">Create multiple alerts with custom names and locations.</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded border border-gray-300 px-3 py-1 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition disabled:opacity-60"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {list.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => selectForEdit(sub)}
              className={`rounded border px-3 py-1 text-sm font-semibold ${
                currentId === sub.id
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-300 text-gray-800 hover:bg-gray-50"
              }`}
            >
              {sub.name || "Untitled"} • {sub.radiusKm} km
            </button>
          ))}
          <button
            type="button"
            onClick={resetForm}
            className="rounded border border-dashed border-gray-300 px-3 py-1 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            + New alert
          </button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-800">Alert name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Home, Office, Mom's place"
            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Enable email notifications
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">Radius</label>
            <div className="flex flex-wrap gap-2">
              {radiusOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRadius(opt.value)}
                  className={`rounded px-3 py-1 text-sm font-semibold border ${
                    radius === opt.value
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-300 text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-600">Choose how far from your saved pin we should look for posts.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">Address (optional)</label>
            <input
              ref={addressInputRef}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., Street 1, City"
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <MapPointPicker
          lat={lat}
          lng={lng}
          onChange={(newLat, newLng) => {
            setLat(newLat);
            setLng(newLng);
          }}
        />
        {lat && lng && (
          <p className="text-xs text-gray-700">
            Pin: {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
          </p>
        )}

        {status && <p className="text-sm text-amber-700">{status}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save settings"}
        </button>
      </form>
    </section>
  );
}
