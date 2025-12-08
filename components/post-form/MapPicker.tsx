import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/maps";

type MapPickerProps = {
  lat: string;
  lng: string;
  onChange: (lat: string, lng: string) => void;
};

export function MapPicker({ lat, lng, onChange }: MapPickerProps) {
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
