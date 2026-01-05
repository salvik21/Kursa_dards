import { Timestamp } from "firebase/firestore";

export type ComplaintStatus = "accepted" | "in_review" | "closed";

export interface Complaint {
  id: string;
  postId: string;
  userId: string; // Lietotājs, kas iesniedzis sūdzību
  reason: string; // Sūdzības iemesls
  status: ComplaintStatus;  // Sūdzības statuss
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  reporterEmail?: string | null;
  blockReason?: string | null;
  blockedByAdminId?: string | null;
  blockedAt?: Timestamp;
}
