import { NextResponse } from "next/server";

export const runtime = "nodejs";

type GeocodeResult = { lat: number; lng: number; formattedAddress?: string };
type GeocodeError = { error: string; status?: number };
type GeocodeResponse = GeocodeResult | GeocodeError;

async function geocode(address: string, countryCode?: string): Promise<GeocodeResponse | null> {
  const apiKey =
    process.env.GOOGLE_GEOCODING_API_KEY ||
    process.env.GOOGLE_MAPS_SERVER_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return { error: "GOOGLE_GEOCODING_API_KEY is not set", status: 500 };
  }

  const apiKeySafe: string = apiKey as string;

  async function request(withCountry: boolean): Promise<GeocodeResponse | null> {
    const params = new URLSearchParams();
    params.set("address", address);
    params.set("key", apiKeySafe);
    if (withCountry && countryCode) {
      params.set("components", `country:${countryCode}`);
      params.set("region", countryCode.toLowerCase());
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`;
    try {
      const res = await fetch(url);
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          (data && (data.error_message || data.status)) || res.statusText || "Neizdevas sasniegt geokodesanas servisu";
        return { error: `Geocode HTTP ${res.status}: ${message}`, status: res.status };
      }

      console.log("Geocode response", {
        status: data?.status,
        error: data?.error_message,
        results: Array.isArray(data?.results) ? data.results.length : 0,
      });

      if (!data || data.status !== "OK" || !data.results?.length) {
        return { error: data?.error_message || data?.status || "NOT_FOUND" };
      }
      const first = data.results[0];
      const location = first?.geometry?.location;
      if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
        return { error: "INVALID_LOCATION" };
      }
      return {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: first.formatted_address,
      };
    } catch (err: any) {
      return { error: err?.message || "Network error while fetching geocode" };
    }
  }

  const isOk = (value: GeocodeResponse | null): value is GeocodeResult =>
    !!value && "lat" in value && typeof value.lat === "number";

  let lastError: GeocodeError | null = null;

  const first = await request(true);
  if (isOk(first)) return first;
  if (first && "error" in first) lastError = first;

  const fallback = await request(false);
  if (isOk(fallback)) return fallback;
  if (fallback && "error" in fallback) lastError = fallback;

  return lastError;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const address = typeof body.address === "string" ? body.address.trim() : "";
    const countryCode =
      typeof body.countryCode === "string" && body.countryCode.trim().length === 2
        ? body.countryCode.trim().toUpperCase()
        : undefined;

    if (!address) {
      return NextResponse.json({ ok: false, error: "Address is required" }, { status: 400 });
    }

    const result = await geocode(address, countryCode);
    if (!result) {
      return NextResponse.json({ ok: false, error: "Geocoding failed" }, { status: 502 });
    }
    if ("error" in result) {
      const status = typeof result.status === "number" && result.status > 0 ? result.status : 400;
      return NextResponse.json({ ok: false, error: result.error }, { status });
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("Geocode API error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
