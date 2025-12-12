import { PhotoUploader } from "./PhotoUploader";
import type { PostFormValues } from "./types";

type PhotosStepProps = {
  values: PostFormValues;
  onUpdate: <K extends keyof PostFormValues>(key: K, value: PostFormValues[K]) => void;
  onUploadingChange?: (uploading: boolean) => void;
};

export function PhotosStep({ values, onUpdate, onUploadingChange }: PhotosStepProps) {
  return <PhotoUploader value={values.photos} onChange={(photos) => onUpdate("photos", photos)} onUploadingChange={onUploadingChange} />;
}
