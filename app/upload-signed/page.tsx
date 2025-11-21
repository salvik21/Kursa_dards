"use client";

import { useState } from "react";

type UploadedFile = {
  name: string;
  url: string;
};

export default function UploadSignedPage() {
  const [status, setStatus] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const selectedFiles = Array.from(fileList);

    try {
      setStatus(`Загружаю ${selectedFiles.length} файл(ов)...`);

      const uploaded: UploadedFile[] = [];

      for (const file of selectedFiles) {
        // 1. просим у сервера signed URL
        const res = await fetch("/api/storage/signed-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            folder: "items", // папка в бакете
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          setStatus("Ошибка (signed URL): " + json.error);
          return;
        }

        const { signedUrl, path } = json as {
          signedUrl: string;
          path: string;
        };

        // 2. грузим файл в Supabase по signedUrl
        const uploadRes = await fetch(signedUrl, {
          method: "PUT",
          headers: {
            "x-upsert": "true",
            "Content-Type": file.type || "application/octet-stream",
          },
          body: file,
        });

        if (!uploadRes.ok) {
          setStatus(`Ошибка загрузки файла: ${file.name}`);
          return;
        }

        // 3. Собираем публичный URL (если bucket public)
        // Формат: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${process.env.NEXT_PUBLIC_SUPABASE_BUCKET_NAME || process.env.SUPABASE_BUCKET_NAME}/${path}`;

        uploaded.push({ name: file.name, url: publicUrl });
      }

      setFiles((prev) => [...prev, ...uploaded]);
      setStatus("Все файлы загружены!");
    } catch (err: any) {
      console.error(err);
      setStatus("Ошибка: " + err.message);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4">
      <input type="file" multiple onChange={handleFileChange} />
      <div>{status}</div>

      {files.length > 0 && (
        <div className="flex flex-col gap-4 mt-4">
          {files.map((f) => (
            <div key={f.url} className="flex flex-col items-center gap-2">
              <span>{f.name}</span>
              <img src={f.url} alt={f.name} style={{ maxWidth: 300 }} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
