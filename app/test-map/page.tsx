"use client";

import { useState } from "react";
import Map from "@/components/Map";
import LocationSelector, { type LocationSelection } from "@/components/LocationSelector";

export default function TestMapPage() {
  const [selection, setSelection] = useState<LocationSelection>({ mode: "none" });

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Map and Location Picker Test</h1>

      <LocationSelector
        presets={[
          { id: "center", label: "Rīga centrs", geo: { lat: 56.9496, lng: 24.1052 } },
          { id: "park", label: "Park" },
        ]}
        onChange={setSelection}
      />

      <div className="rounded border border-gray-200 p-3 text-sm text-gray-800">
        <div>Mode: {selection.mode}</div>
        {selection.placeName && <div>placeName: {selection.placeName}</div>}
        {selection.addressText && <div>addressText: {selection.addressText}</div>}
        {selection.geo && (
          <div>
            geo: {selection.geo.lat.toFixed(5)}, {selection.geo.lng.toFixed(5)}
          </div>
        )}
        {selection.presetId && <div>presetId: {selection.presetId}</div>}
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Basic map (no picker)</h2>
        <Map />
      </div>
    </main>
  );
}
