import { PhotoUploader } from "./PhotoUploader";
import type { PostFormValues } from "./types";

type PhotosStepProps = {
  values: PostFormValues;
  onUpdate: <K extends keyof PostFormValues>(key: K, value: PostFormValues[K]) => void;
};

export function PhotosStep({ values, onUpdate }: PhotosStepProps) {
  return <PhotoUploader value={values.photos} onChange={(photos) => onUpdate("photos", photos)} />;
}
