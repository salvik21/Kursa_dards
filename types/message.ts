import { Timestamp } from "firebase/firestore";

export interface Message {
  id: string;

  postId: string;     // sludinājuma ID
  toUserId: string;   // kam sūtīts

  userId?: string;    // autor, ja autentificēts
  fromName?: string;  // ja viesis
  fromEmail?: string; // ja viesis

  content: string;
  createdAt: Timestamp;
}
