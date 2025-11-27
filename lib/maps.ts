import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

export async function loadGoogleMaps() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing");
  }

  setOptions({
    key: apiKey,
    libraries: ["places"],
  });

  const [{ Map }, placesLib] = await Promise.all([
    importLibrary("maps"),
    importLibrary("places"),
  ]);

  return {
    Map,
    places: placesLib,
  };
}
