"use client";

import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/maps";

export default function Map() {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const gm = await loadGoogleMaps();
        if (cancelled || !mapRef.current) return;
        new gm.Map(mapRef.current, {
          center: { lat: 55.751244, lng: 37.618423 },
          zoom: 12,
        });
      } catch (error) {
        console.error("Failed to load Google Maps", error);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "400px",
        background: "yellow", // Simple fallback background until the map renders
      }}
    />
  );
}
