"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GeoPoint } from "@/types/post";

type LocationMode = "none" | "address" | "map" | "list";

export interface PresetPlace {
  id: string;
  label: string;
  geo?: GeoPoint;
}

export interface LocationSelection {
  mode: LocationMode;
  geo?: GeoPoint;
  placeName?: string;
  addressText?: string;
  presetId?: string;
}

interface Props {
  presets?: PresetPlace[];
  onChange?: (selection: LocationSelection) => void;
}

const modes: { value: LocationMode; label: string }[] = [
  { value: "none", label: "No location" },
  { value: "address", label: "Enter address" },
  { value: "map", label: "Drop a pin" },
  { value: "list", label: "Choose from list" },
];

export function LocationSelector({ presets = [], onChange }: Props) {
  const [mode, setMode] = useState<LocationMode>("none");
  const [addressText, setAddressText] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [presetId, setPresetId] = useState<string | undefined>();
  const [geo, setGeo] = useState<GeoPoint | undefined>();

  // Notify parent on any change
  useEffect(() => {
    onChange?.({ mode, geo, placeName, addressText, presetId });
  }, [mode, geo, placeName, addressText, presetId, onChange]);

  // Map handling
  const mapRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (mode !== "map") return;
    if (!mapRef.current || typeof window === "undefined" || !window.google) return;

    const center = geo ?? { lat: 56.9496, lng: 24.1052 }; // Riga default
    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 10,
    });

    const marker = new window.google.maps.Marker({
      position: center,
      map,
      draggable: true,
    });
    markerRef.current = marker;

    const updatePosition = () => {
      const pos = marker.getPosition();
      if (!pos) return;
      const nextGeo = { lat: pos.lat(), lng: pos.lng() };
      setGeo(nextGeo);
      setPlaceName("");
    };

    marker.addListener("dragend", updatePosition);
    map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      marker.setPosition(e.latLng);
      updatePosition();
    });

    return () => {
      marker.setMap(null);
    };
  }, [mode, geo]);

  // Preset lookup
  const presetOptions = useMemo(
    () => presets.map((p) => ({ value: p.id, label: p.label })),
    [presets]
  );

  useEffect(() => {
    if (mode !== "list") return;
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) {
      setGeo(undefined);
      setPlaceName("");
      return;
    }
    setGeo(preset.geo);
    setPlaceName(preset.label);
  }, [mode, presetId, presets]);

  // Mode switching should clear previous mode data
  useEffect(() => {
    setGeo(undefined);
    setPlaceName("");
    setPresetId(undefined);
    setAddressText("");
  }, [mode]);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-800">Location</label>
      <div className="flex gap-2 flex-wrap">
        {modes.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMode(m.value)}
            className={`px-3 py-1 rounded border ${
              mode === m.value ? "bg-blue-50 border-blue-500 text-blue-700" : "border-gray-300"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "address" && (
        <div className="space-y-2">
          <input
            type="text"
            value={addressText}
            onChange={(e) => setAddressText(e.target.value)}
            placeholder="Enter an address or landmark"
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
          <p className="text-xs text-gray-500">
            You can leave it blank or add a landmark; coordinates are not set automatically.
          </p>
        </div>
      )}

      {mode === "map" && (
        <div className="space-y-2">
          <div
            ref={mapRef}
            className="w-full h-64 rounded border border-gray-300"
            role="presentation"
          />
          <p className="text-xs text-gray-500">
            Click the map or drag the marker. Coordinates will be saved.
          </p>
          {geo && (
            <div className="text-xs text-gray-700">
              Pin: {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}
            </div>
          )}
        </div>
      )}

      {mode === "list" && (
        <div className="space-y-2">
          <select
            value={presetId ?? ""}
            onChange={(e) => setPresetId(e.target.value || undefined)}
            className="w-full rounded border border-gray-300 px-3 py-2"
          >
            <option value="">Select a place</option>
            {presetOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">
            We store the place name and coordinates if the preset includes them.
          </p>
        </div>
      )}
    </div>
  );
}

export default LocationSelector;
