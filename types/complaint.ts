import { Timestamp } from "firebase/firestore";

export type ComplaintStatus = "new" | "in_review" | "closed";

export interface Complaint {
  id: string;
  postId: string;
  userId: string;
  reason: string;
  status: ComplaintStatus;
  createdAt: Timestamp;
}
