"use client";

import { useEffect, useState } from "react";

type Props = {
  photos: string[];
};

export default function PhotoGallery({ photos }: Props) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActive(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!photos?.length) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {photos.map((url) => (
          <button
            key={url}
            type="button"
            onClick={() => setActive(url)}
            className="overflow-hidden rounded-lg border border-gray-200 shadow-sm"
          >
            <img
              src={url}
              alt="Post photo"
              className="h-24 w-32 object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setActive(null)}
        >
          <div
            className="relative max-h-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={active}
              alt="Full size"
              className="max-h-[80vh] max-w-full rounded-lg shadow-xl"
            />
            <button
              type="button"
              onClick={() => setActive(null)}
              className="absolute right-2 top-2 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-gray-800 shadow"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
