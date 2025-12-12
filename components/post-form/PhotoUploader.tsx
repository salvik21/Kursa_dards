import { useRef, useState } from "react";
import { uploadPhotos } from "@/lib/api/upload";

type PhotoUploaderProps = {
  value: string[];
  onChange: (urls: string[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
};

export function PhotoUploader({ value, onChange, onUploadingChange }: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const newUrls = await uploadPhotos(files);
      const combined = [...value, ...newUrls].slice(0, 5);
      onChange(combined);
    } catch (err: any) {
      setError(err?.message || "Neizdevās augšupielādēt");
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  const removePhoto = (url: string) => {
    onChange(value.filter((u) => u !== url));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-800">Foto</label>
        <span className="text-xs text-gray-500">Maks. 5</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition disabled:opacity-60"
        >
          Izvēlēties failus
        </button>
        <span className="text-xs text-gray-600">
          {value.length === 0 ? "Faili nav atlasīti" : `${value.length} fail(i) atlasīti`}
        </span>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        disabled={uploading}
        className="sr-only"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {value.map((url) => (
          <div key={url} className="relative overflow-hidden rounded border border-gray-200">
            <img src={url} alt="augšupielādēts foto" className="h-28 w-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(url)}
              className="absolute right-1 top-1 rounded bg-white/80 px-2 py-1 text-xs font-semibold text-red-600 shadow"
            >
              Noņemt
            </button>
          </div>
        ))}
      </div>
      {uploading && <p className="text-sm text-gray-600">Augšupielādē...</p>}
    </div>
  );
}
