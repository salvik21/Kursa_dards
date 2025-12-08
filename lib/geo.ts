export type LatLng = { lat: number; lng: number };

function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

/**
 * Returns great-circle distance between two points in kilometers.
 */
export function distanceKm(a: LatLng, b: LatLng) {
  const R = 6371; // Earth radius in km
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const h =
    sinLat * sinLat +
    Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}
