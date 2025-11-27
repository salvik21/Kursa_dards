import { Timestamp } from "firebase/firestore";

export interface Photo {
  id: string;
  postId: string;
  url: string;
  alt?: string;
  hidden?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
