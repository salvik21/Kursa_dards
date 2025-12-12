export type GeocodeResult = { lat: number; lng: number; formattedAddress?: string };

/**
 * Geocode a free-form address string using Google Geocoding API.
 * Returns null if not found or malformed.
 */
export async function geocodeAddress(address: string, countryCode?: string): Promise<GeocodeResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_GEOCODING_API_KEY;
  if (!apiKey) {
    throw new Error("Google Maps API key is missing");
  }
  const apiKeySafe: string = apiKey;

  async function request(withCountry: boolean) {
    const params = new URLSearchParams();
    params.set("address", address);
    params.set("key", apiKeySafe);
    if (withCountry && countryCode) {
      params.set("components", `country:${countryCode}`);
      params.set("region", countryCode.toLowerCase());
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Failed to fetch geocode");
    }
    const data = await res.json();
    if (data.status !== "OK" || !data.results?.length) {
      return null;
    }
    const first = data.results[0];
    const location = first?.geometry?.location;
    if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
      return null;
    }

    return {
      lat: location.lat,
      lng: location.lng,
      formattedAddress: first.formatted_address,
    };
  }

  // First try with country bias (if provided)
  const withCountry = await request(true);
  if (withCountry) return withCountry;

  // Fallback: try without country bias
  return request(false);
}
