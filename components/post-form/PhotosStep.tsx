import { PhotoUploader } from "./PhotoUploader";
import type { PostFormValues } from "./types";

type PhotosStepProps = {
  values: PostFormValues;
  onUpdate: <K extends keyof PostFormValues>(key: K, value: PostFormValues[K]) => void;
  onUploadingChange?: (uploading: boolean) => void;
};

export function PhotosStep({ values, onUpdate, onUploadingChange }: PhotosStepProps) {
  const canHidePhotos = values.type === "found";

  return (
    <div className="space-y-3">
      {canHidePhotos && (
        <label className="inline-flex items-center gap-2 text-sm text-gray-800">
          <input
            type="checkbox"
            checked={values.hidePhotos === true}
            onChange={(e) => onUpdate("hidePhotos", e.target.checked)}
          />
          Pasl„"pt foto publiski
          <span className="text-xs text-gray-500">(redzamas tikai jums un administratoriem)</span>
        </label>
      )}

      <PhotoUploader
        value={values.photos}
        hidden={values.hiddenPhotos ?? []}
        onHiddenChange={(hiddenList) => onUpdate("hiddenPhotos", hiddenList)}
        onChange={(photos) => onUpdate("photos", photos)}
        onUploadingChange={onUploadingChange}
      />
    </div>
  );
}
