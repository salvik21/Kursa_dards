import { AddressFields } from "./AddressFields";
import { MapPicker } from "./MapPicker";
import { PlaceSelector } from "./PlaceSelector";
import type { LocationMode, Option, PostFormValues } from "./types";

type LocationStepProps = {
  locationMode: LocationMode;
  values: PostFormValues;
  placeOptions: Option[];
  address: { street: string; city: string; country: string };
  lat: string;
  lng: string;
  onLocationModeChange: (mode: LocationMode) => void;
  onPlaceChange: (value: string) => void;
  onAddressChange: (field: "street" | "city" | "country", value: string) => void;
  onLatLngChange: (lat: string, lng: string) => void;
  onPlaceNameChange: (value: string) => void;
};

export function LocationStep({
  locationMode,
  values,
  placeOptions,
  address,
  lat,
  lng,
  onLocationModeChange,
  onPlaceChange,
  onAddressChange,
  onLatLngChange,
  onPlaceNameChange,
}: LocationStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-800">Ka iestatit atrasanas vietu?</label>
        <div className="flex flex-wrap gap-3 text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="loc-mode" checked={locationMode === "list"} onChange={() => onLocationModeChange("list")} />
            Izveleties no saraksta
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="loc-mode" checked={locationMode === "address"} onChange={() => onLocationModeChange("address")} />
            Ievadit adresi
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="loc-mode" checked={locationMode === "map"} onChange={() => onLocationModeChange("map")} />
            Izveleties karte
          </label>
        </div>
      </div>

      {locationMode === "list" && <PlaceSelector value={values.placeName} options={placeOptions} onChange={onPlaceChange} />}

      {locationMode === "address" && (
        <AddressFields
          street={address.street}
          city={address.city}
          country={address.country}
          onStreetChange={(v) => onAddressChange("street", v)}
          onCityChange={(v) => onAddressChange("city", v)}
          onCountryChange={(v) => onAddressChange("country", v)}
        />
      )}

      {locationMode === "map" && (
        <div className="space-y-4">
          <MapPicker lat={lat} lng={lng} onChange={onLatLngChange} />
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-800">Vietas nosaukums (pec izveles)</label>
            <input
              value={values.placeName}
              onChange={(e) => onPlaceNameChange(e.target.value)}
              placeholder="piem., Parka ieeja"
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
