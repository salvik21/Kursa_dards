import { NextResponse } from "next/server";

export const runtime = "nodejs";

type GeocodeResult = { lat: number; lng: number; formattedAddress?: string };
type GeocodeError = { error: string };
type GeocodeResponse = GeocodeResult | GeocodeError;

async function geocode(address: string, countryCode?: string): Promise<GeocodeResult | null> {
  const apiKey =
    process.env.GOOGLE_GEOCODING_API_KEY ||
    process.env.GOOGLE_MAPS_SERVER_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_GEOCODING_API_KEY is not set");
  }
  // Explicitly narrow to string for TS
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
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Failed to fetch geocode");
    }
    const data = await res.json();
    // Log status and error to server console for debugging
    console.log("Geocode response", {
      status: data?.status,
      error: data?.error_message,
      results: Array.isArray(data?.results) ? data.results.length : 0,
    });
    if (data.status !== "OK" || !data.results?.length) {
      return { error: data.error_message || data.status || "NOT_FOUND" } as const;
    }
    const first = data.results[0];
    const location = first?.geometry?.location;
    if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
      return { error: "INVALID_LOCATION" } as const;
    }
    return {
      lat: location.lat,
      lng: location.lng,
      formattedAddress: first.formatted_address,
    };
  }

  const isOk = (value: GeocodeResponse | null): value is GeocodeResult =>
    !!value && "lat" in value && typeof value.lat === "number";

  const first = await request(true);
  if (isOk(first)) return first;
  const fallback = await request(false);
  if (isOk(fallback)) return fallback;
  return null;
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
      return NextResponse.json({ ok: false, error: "Geocoding failed" }, { status: 404 });
    }
    if ("error" in result) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
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
