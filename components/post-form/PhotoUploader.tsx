import { useState } from "react";
import { uploadPhotos } from "@/lib/api/upload";

type PhotoUploaderProps = {
  value: string[];
  onChange: (urls: string[]) => void;
};

export function PhotoUploader({ value, onChange }: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const newUrls = await uploadPhotos(files);
      const combined = [...value, ...newUrls].slice(0, 5);
      onChange(combined);
    } catch (err: any) {
      setError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (url: string) => {
    onChange(value.filter((u) => u !== url));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-800">Photos</label>
        <span className="text-xs text-gray-500">Max 5</span>
      </div>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        disabled={uploading}
        className="block w-full text-sm text-gray-700 file:mr-3 file:rounded file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700 disabled:opacity-60"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {value.map((url) => (
          <div key={url} className="relative overflow-hidden rounded border border-gray-200">
            <img src={url} alt="uploaded" className="h-28 w-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(url)}
              className="absolute right-1 top-1 rounded bg-white/80 px-2 py-1 text-xs font-semibold text-red-600 shadow"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      {uploading && <p className="text-sm text-gray-600">Uploading...</p>}
    </div>
  );
}
