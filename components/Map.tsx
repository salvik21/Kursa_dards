"use client";

import { useEffect, useRef } from "react";

export default function Map() {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function initMap() {
      if (!window.google || !mapRef.current) return;

      new window.google.maps.Map(mapRef.current, {
        center: { lat: 55.751244, lng: 37.618423 },
        zoom: 12,
      });
    }

    // если скрипт уже успел загрузиться
    if (window.google) {
      initMap();
      return;
    }

    // иначе ждём пользовательское событие от GoogleMapsLoader
    window.addEventListener("google-maps-loaded", initMap);

    return () => {
      window.removeEventListener("google-maps-loaded", initMap);
    };
  }, []);

  return (
  <div
    ref={mapRef}
    style={{
      width: "100%",
      height: "400px",
      background: "yellow", // чтобы увидеть контейнер
    }}
  />
);
}
