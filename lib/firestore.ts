import {
  addDoc,
  collection,
  doc,
  getDoc,
  Timestamp,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
} from "firebase/firestore";

import { db } from "./firebase/client";
import type { Complaint } from "@/types/complaint";
import type { Message } from "@/types/message";
import type { Photo } from "@/types/photo";
import type { Post } from "@/types/post";
import type { Subscription } from "@/types/subscription";
import type { User } from "@/types/user";

// Injects the document id into the typed model
function withIdConverter<T extends { id: string }>(): FirestoreDataConverter<T> {
  return {
    toFirestore(model: T) {
      const { id, ...data } = model;
      return data as any;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): T {
      return {
        id: snapshot.id,
        ...(snapshot.data(options) as Omit<T, "id">),
      } as T;
    },
  };
}

// ----------------------------------------------------------
// 3. Collections with converters
// ----------------------------------------------------------

// USERS
export const userConverter = withIdConverter<User>();
export const usersCollection = collection(db, "users").withConverter(userConverter);

// POSTS
export const postConverter = withIdConverter<Post>();
export const postsCollection = collection(db, "posts").withConverter(postConverter);

// PHOTOS
export const photoConverter = withIdConverter<Photo>();
export const photosCollection = collection(db, "photos").withConverter(photoConverter);

// MESSAGES
export const messageConverter = withIdConverter<Message>();
export const messagesCollection = collection(db, "messages").withConverter(messageConverter);

// COMPLAINTS
export const complaintConverter = withIdConverter<Complaint>();
export const complaintsCollection = collection(db, "complaints").withConverter(complaintConverter);

// SUBSCRIPTIONS
export const subscriptionConverter = withIdConverter<Subscription>();
export const subscriptionsCollection = collection(db, "subscriptions").withConverter(
  subscriptionConverter
);

// ----------------------------------------------------------
// 4. CRUD helpers (basic create/read)
// ----------------------------------------------------------

// --- USERS ---
export async function createUser(data: Omit<User, "id" | "createdAt">) {
  const ref = await addDoc(usersCollection, {
    ...data,
    createdAt: Timestamp.now()
  } as Omit<User, "id">);

  return (await getDoc(ref)).data() as User;
}

export async function getUser(userId: string) {
  const snap = await getDoc(doc(usersCollection, userId));
  return snap.exists() ? (snap.data() as User) : null;
}

// --- POSTS ---
export async function createPost(data: Omit<Post, "id" | "createdAt" | "updatedAt">) {
  const now = Timestamp.now();
  const ref = await addDoc(postsCollection, {
    ...data,
    createdAt: now,
    updatedAt: now
  } as Omit<Post, "id">);

  return (await getDoc(ref)).data() as Post;
}

export async function getPost(id: string) {
  const snap = await getDoc(doc(postsCollection, id));
  return snap.exists() ? (snap.data() as Post) : null;
}

// --- PHOTOS ---
export async function createPhoto(data: Omit<Photo, "id" | "createdAt" | "updatedAt">) {
  const now = Timestamp.now();
  const ref = await addDoc(photosCollection, {
    ...data,
    createdAt: now,
    updatedAt: now
  } as Omit<Photo, "id">);

  return (await getDoc(ref)).data() as Photo;
}

export async function getPhoto(id: string) {
  const snap = await getDoc(doc(photosCollection, id));
  return snap.exists() ? (snap.data() as Photo) : null;
}

// --- MESSAGES ---
export async function createMessage(data: Omit<Message, "id" | "createdAt">) {
  const ref = await addDoc(messagesCollection, {
    ...data,
    createdAt: Timestamp.now()
  } as Omit<Message, "id">);

  return (await getDoc(ref)).data() as Message;
}

export async function getMessage(id: string) {
  const snap = await getDoc(doc(messagesCollection, id));
  return snap.exists() ? (snap.data() as Message) : null;
}

// --- COMPLAINTS ---
export async function createComplaint(data: Omit<Complaint, "id" | "createdAt">) {
  const ref = await addDoc(complaintsCollection, {
    ...data,
    createdAt: Timestamp.now()
  } as Omit<Complaint, "id">);

  return (await getDoc(ref)).data() as Complaint;
}

export async function getComplaint(id: string) {
  const snap = await getDoc(doc(complaintsCollection, id));
  return snap.exists() ? (snap.data() as Complaint) : null;
}

// --- SUBSCRIPTIONS ---
export async function createSubscription(
  data: Omit<Subscription, "id">
) {
  const ref = await addDoc(subscriptionsCollection, data as Omit<Subscription, "id">);
  return (await getDoc(ref)).data() as Subscription;
}

export async function getSubscription(id: string) {
  const snap = await getDoc(doc(subscriptionsCollection, id));
  return snap.exists() ? (snap.data() as Subscription) : null;
}
