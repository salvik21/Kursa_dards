import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireSessionUser } from "@/lib/auth/server";

export const runtime = "nodejs";

const ALLOWED_RADII = [0.5, 1, 2, 3, 4];

type NormalizedLocation = {
  geo: { lat: number; lng: number };
  address?: string;
  region?: string;
};

function normalizeLocation(raw: any): NormalizedLocation | null {
  if (!raw || typeof raw !== "object") return null;
  const lat = Number(raw.geo?.lat);
  const lng = Number(raw.geo?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const address = typeof raw.address === "string" ? raw.address.trim() : undefined;
  const region = typeof raw.region === "string" ? raw.region.trim() : undefined;

  const result: NormalizedLocation = { geo: { lat, lng } };
  if (address) result.address = address;
  if (region) result.region = region;
  return result;
}

export async function GET() {
  try {
    const user = await requireSessionUser();
    const snap = await adminDb.collection("subscriptions").where("userId", "==", user.uid).get();

    const subscriptions = snap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as any),
    }));

    return NextResponse.json({ ok: true, subscriptions });
  } catch (error: any) {
    console.error("GET /api/me/subscription error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load subscriptions" },
      { status: error?.message === "Unauthenticated" ? 401 : 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireSessionUser();
    const body = await req.json();
    const enabled = !!body.enabled;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ ok: false, error: "Name is required" }, { status: 400 });
    }
    if (!ALLOWED_RADII.includes(Number(body.radiusKm))) {
      return NextResponse.json({ ok: false, error: "Invalid radius" }, { status: 400 });
    }
    const location = normalizeLocation(body.location);
    if (enabled && !location) {
      return NextResponse.json({ ok: false, error: "Location is required" }, { status: 400 });
    }

    const now = new Date();
    const payload = {
      userId: user.uid,
      userEmail: user.email ?? "",
      name,
      enabled,
      radiusKm: Number(body.radiusKm),
      location: location ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await adminDb.collection("subscriptions").add(payload);

    return NextResponse.json({ ok: true, subscription: { id: ref.id, ...payload } });
  } catch (error: any) {
    console.error("POST /api/me/subscription error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to create subscription" },
      { status: error?.message === "Unauthenticated" ? 401 : 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireSessionUser();
    const body = await req.json();
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json({ ok: false, error: "Subscription id is required" }, { status: 400 });
    }

    const ref = adminDb.collection("subscriptions").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    const data = snap.data() as any;
    if (data.userId !== user.uid) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const update: Record<string, any> = { updatedAt: new Date() };
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return NextResponse.json({ ok: false, error: "Invalid name" }, { status: 400 });
      }
      update.name = body.name.trim();
    }
    if (body.radiusKm !== undefined) {
      if (!ALLOWED_RADII.includes(Number(body.radiusKm))) {
        return NextResponse.json({ ok: false, error: "Invalid radius" }, { status: 400 });
      }
      update.radiusKm = Number(body.radiusKm);
    }
    if (body.enabled !== undefined) {
      update.enabled = !!body.enabled;
    }
    if (body.location !== undefined) {
      const location = normalizeLocation(body.location);
      if (update.enabled && !location) {
        return NextResponse.json({ ok: false, error: "Location is required" }, { status: 400 });
      }
      update.location = location ?? null;
    }

    await ref.update(update);
    const updated = { ...data, ...update };
    return NextResponse.json({ ok: true, subscription: { id, ...updated } });
  } catch (error: any) {
    console.error("PATCH /api/me/subscription error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to update subscription" },
      { status: error?.message === "Unauthenticated" ? 401 : 500 }
    );
  }
}
