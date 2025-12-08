import { Timestamp } from "firebase/firestore";

export type PostType = "lost" | "found";
export type PostStatus = "pending" | "open" | "resolved" | "closed" | "hidden";

export interface GeoPoint {
  lat: number;
  lng: number;
}

// Previous nested location shape kept for reference; remove when no longer used.
// export interface Geo {
//   address?: string;
//   region?: string;
//   geo: GeoPoint;
// }

export interface Post {
  id: string;
  userId: string;

  title: string;
  type: PostType;
  status: PostStatus;
  category: string;
  tags: string[];

  placeName?: string;
  // Flattened optional geo per plan (use this going forward)
  geo?: GeoPoint;
  // Old nested location shape retained for reference; remove once unused.
  // location?: Geo;

  description: string;
  descriptionHidden?: boolean;
  blockedReason?: string;
  blockedBy?: string;
  blockedComplaintId?: string;
  blockedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
