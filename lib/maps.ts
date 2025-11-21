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

  await importLibrary("maps");
  await importLibrary("places");
  return google.maps;
}
