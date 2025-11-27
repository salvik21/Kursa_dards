import type { GeoPoint } from "./post";

export interface SubscriptionLocation {
  geo: GeoPoint;
  region?: string;
  address?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  radiusKm: number;
  location: SubscriptionLocation;
  categories?: string[];
}
