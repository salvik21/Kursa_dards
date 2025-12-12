export type PostType = "lost" | "found";
export type LocationMode = "list" | "address" | "map";

export type PostFormValues = {
  title: string;
  type: PostType;
  category: string;
  placeName: string;
  description: string;
  tags: string[];
  photos: string[];
  geo?: { lat: number; lng: number } | null;
  showEmail?: boolean;
  showPhone?: boolean;
  privateNote?: string;
};

export type Option = { id: string; name: string; lat?: number; lng?: number };

export type PostFormProps = {
  mode: "create" | "edit";
  initialValues: PostFormValues;
  onSubmit: (payload: PostFormValues) => Promise<void>;
  onCancelHref: string;
};
