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

// Pieliek dokumenta id pie tipizeta modeļa
function withIdConverter<T extends { id: string }>(): FirestoreDataConverter<T> {
  return {
    toFirestore(model: T) {
      // Izmet id, jo Firestore to glaba atseviski
      const { id, ...data } = model;
      return data as any;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): T {
      // Atjauno id no snapshot un apvieno ar datiem
      return {
        id: snapshot.id,
        ...(snapshot.data(options) as Omit<T, "id">),
      } as T;
    },
  };
}

// ----------------------------------------------------------
// Kolekcijas ar konvertetajiem tipiem
// ----------------------------------------------------------

// LIETOTAJI
export const userConverter = withIdConverter<User>();
export const usersCollection = collection(db, "users").withConverter(userConverter);

// IERAKSTI
export const postConverter = withIdConverter<Post>();
export const postsCollection = collection(db, "posts").withConverter(postConverter);

// FOTO
export const photoConverter = withIdConverter<Photo>();
export const photosCollection = collection(db, "photos").withConverter(photoConverter);

// ZINAS
export const messageConverter = withIdConverter<Message>();
export const messagesCollection = collection(db, "messages").withConverter(messageConverter);

// SUDZIBAS
export const complaintConverter = withIdConverter<Complaint>();
export const complaintsCollection = collection(db, "complaints").withConverter(complaintConverter);

// ABONEMENTI
export const subscriptionConverter = withIdConverter<Subscription>();
export const subscriptionsCollection = collection(db, "subscriptions").withConverter(
  subscriptionConverter
);

// ----------------------------------------------------------
// CRUD paligi (izveide un nolasīšana)
// ----------------------------------------------------------

// --- LIETOTAJI ---
export async function createUser(data: Omit<User, "id" | "createdAt">) {
  // Saglabajam ar izveides laiku
  const ref = await addDoc(usersCollection, {
    ...data,
    createdAt: Timestamp.now()
  } as Omit<User, "id">);

  // Atgriezam pilno objektu ar id
  return (await getDoc(ref)).data() as User;
}

export async function getUser(userId: string) {
  // Nolasam vienu lietotaju pec id
  const snap = await getDoc(doc(usersCollection, userId));
  return snap.exists() ? (snap.data() as User) : null;
}

// --- IERAKSTI ---
export async function createPost(data: Omit<Post, "id" | "createdAt" | "updatedAt">) {
  // Izveidei un atjaunosanai tas pats laiks
  const now = Timestamp.now();
  const ref = await addDoc(postsCollection, {
    ...data,
    createdAt: now,
    updatedAt: now
  } as Omit<Post, "id">);

  // Atgriezam saglabato ierakstu
  return (await getDoc(ref)).data() as Post;
}

export async function getPost(id: string) {
  // Nolasam vienu ierakstu pec id
  const snap = await getDoc(doc(postsCollection, id));
  return snap.exists() ? (snap.data() as Post) : null;
}

// --- FOTO ---
export async function createPhoto(data: Omit<Photo, "id" | "createdAt" | "updatedAt">) {
  // Foto glabajam ar laika zimi
  const now = Timestamp.now();
  const ref = await addDoc(photosCollection, {
    ...data,
    createdAt: now,
    updatedAt: now
  } as Omit<Photo, "id">);

  // Atgriezam pilno foto objektu
  return (await getDoc(ref)).data() as Photo;
}

export async function getPhoto(id: string) {
  // Nolasam vienu foto pec id
  const snap = await getDoc(doc(photosCollection, id));
  return snap.exists() ? (snap.data() as Photo) : null;
}

// --- ZINAS ---
export async function createMessage(data: Omit<Message, "id" | "createdAt">) {
  // Zina ar izveides laiku
  const ref = await addDoc(messagesCollection, {
    ...data,
    createdAt: Timestamp.now()
  } as Omit<Message, "id">);

  // Atgriezam saglabato zinu
  return (await getDoc(ref)).data() as Message;
}

export async function getMessage(id: string) {
  // Nolasam vienu zinu pec id
  const snap = await getDoc(doc(messagesCollection, id));
  return snap.exists() ? (snap.data() as Message) : null;
}

// --- SUDZIBAS ---
export async function createComplaint(data: Omit<Complaint, "id" | "createdAt">) {
  // Sudziba ar izveides laiku
  const ref = await addDoc(complaintsCollection, {
    ...data,
    createdAt: Timestamp.now()
  } as Omit<Complaint, "id">);

  // Atgriezam saglabato sudzibu
  return (await getDoc(ref)).data() as Complaint;
}

export async function getComplaint(id: string) {
  // Nolasam vienu sudzibu pec id
  const snap = await getDoc(doc(complaintsCollection, id));
  return snap.exists() ? (snap.data() as Complaint) : null;
}

// --- ABONEMENTI ---
export async function createSubscription(
  data: Omit<Subscription, "id">
) {
  // Abonements bez laika laukiem
  const ref = await addDoc(subscriptionsCollection, data as Omit<Subscription, "id">);
  return (await getDoc(ref)).data() as Subscription;
}

export async function getSubscription(id: string) {
  // Nolasam abonementu pec id
  const snap = await getDoc(doc(subscriptionsCollection, id));
  return snap.exists() ? (snap.data() as Subscription) : null;
}
