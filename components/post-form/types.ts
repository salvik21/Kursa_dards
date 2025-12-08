export type PostType = "lost" | "found";
export type LocationMode = "list" | "address" | "map";

export type PostFormValues = {
  title: string;
  type: PostType;
  category: string;
  tags: string[];
  placeName: string;
  description: string;
  photos: string[];
  geo?: { lat: number; lng: number } | null;
};

export type Option = { id: string; name: string };

export type PostFormProps = {
  mode: "create" | "edit";
  initialValues: PostFormValues;
  onSubmit: (payload: PostFormValues & { geo?: { lat: number; lng: number } | null }) => Promise<void>;
  onCancelHref: string;
};
