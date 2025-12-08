export async function uploadPhotos(files: FileList): Promise<string[]> {
  const newUrls: string[] = [];
  for (const file of Array.from(files)) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload-photo", { method: "POST", body: form });
    const json = await res.json();
    if (!res.ok || !json.url) {
      throw new Error(json?.error || "Upload failed");
    }
    newUrls.push(json.url);
  }
  return newUrls;
}
