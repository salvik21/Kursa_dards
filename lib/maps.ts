import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

let configured = false;

export async function loadGoogleMaps() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing");
  }

  if (!configured) {
    setOptions({
      key: apiKey,
      libraries: ["places"],
    });
    configured = true;
  }

  const [{ Map }, { Marker }, placesLib] = await Promise.all([
    importLibrary("maps"),
    importLibrary("marker"),
    importLibrary("places"),
  ]);

  return {
    Map,
    Marker,
    places: placesLib,
  };
}
