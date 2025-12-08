import { Timestamp } from "firebase/firestore";

export type ComplaintStatus = "accepted" | "in_review" | "closed";

export interface Complaint {
  id: string;
  postId: string;
  userId: string; // "0" for гостевой запрос
  reason: string;
  status: ComplaintStatus;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  postTitle?: string;
  postStatus?: string;
  reporterName?: string | null;
  reporterEmail?: string | null;
  blockReason?: string | null;
  blockedByAdminId?: string | null;
  blockedAt?: Timestamp;
}
