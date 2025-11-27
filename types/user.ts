import { Timestamp } from "firebase/firestore";

export type UserRole = "user" | "admin";

export interface UserAddress {
  street?: string;
  houseNr?: string;
  city?: string;
  label?: string;
}

export interface PrivateContact {
  emailHidden?: boolean;
  phoneHidden?: boolean;
  nameHidden?: boolean;
}

export type AuthProviderType =  "google" | "facebook" | "anonymous";

export interface AuthProvider {
  type: AuthProviderType;
  externalId?: string;
}

export interface User {
  id: string;                // Firestore doc id
  role: UserRole;
  name?: string;
  email: string;
  phone?: string;
  blocked?: boolean;
  canLogin?: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;

  address?: UserAddress;
  privateContact?: PrivateContact;
  authProviders?: AuthProvider[];
}
