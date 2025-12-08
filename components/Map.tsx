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
          center: { lat: 56.9496, lng: 24.1052 }, // Riga default
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
