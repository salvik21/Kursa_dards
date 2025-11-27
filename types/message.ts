import { Timestamp } from "firebase/firestore";

export interface Message {
  id: string;

  postId: string;     // объявление
  toUserId: string;   // владелец объявления

  userId?: string;    // автор, если авторизован
  fromName?: string;  // если гость
  fromEmail?: string; // если гость

  content: string;
  createdAt: Timestamp;
}
