"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/maps";

type Props = {
  lat: number;
  lng: number;
  label?: string;
};

export default function LocationMap({ lat, lng, label }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let marker: google.maps.Marker | null = null;
    let map: google.maps.Map | null = null;
    let cancelled = false;

    async function init() {
      try {
        const gm = await loadGoogleMaps();
        if (cancelled || !mapRef.current) return;

        const center = { lat, lng };
        map = new gm.Map(mapRef.current, {
          center,
          zoom: 13,
        });

        marker = new gm.Marker({
          position: center,
          map,
          title: label || "Location",
        });
      } catch (err: any) {
        setError(err?.message || "Neizdevas ieladet karti");
      }
    }

    init();
    return () => {
      cancelled = true;
      if (marker) {
        marker.setMap(null);
      }
    };
  }, [lat, lng, label]);

  return (
    <div className="mt-3 space-y-2">
      <div
        ref={mapRef}
        className="h-64 w-full rounded border border-gray-200"
        role="presentation"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
