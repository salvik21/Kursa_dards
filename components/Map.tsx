"use client";

import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/maps";

export default function Map() {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let canceled = false;

    async function initMap() {
      try {
        const { Map } = await loadGoogleMaps();
        if (canceled || !mapRef.current) return;
        new Map(mapRef.current, {
          center: { lat: 55.751244, lng: 37.618423 },
          zoom: 12,
        });
      } catch (error) {
        console.error("Failed to init map", error);
      }
    }

    initMap();

    return () => {
      canceled = true;
    };
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "400px",
        background: "yellow",
      }}
    />
  );
}
