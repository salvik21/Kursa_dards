import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ ok: false, error: "Supabase not configured (check env keys)" }, { status: 500 });
  }

  const bucket =
    process.env.NEXT_PUBLIC_SUPABASE_BUCKET ||
    process.env.SUPABASE_BUCKET_NAME ||
    "lost-and-found";
  const folder = process.env.NEXT_PUBLIC_SUPABASE_FOLDER || "items";

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "No file" }, { status: 400 });
  }

  const ext = (file.name?.split(".").pop() || "bin").toLowerCase();
  const path = `${folder}/${randomUUID()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { data, error } = await supabaseServer.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error || !data?.path) {
    console.error("Supabase upload error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Upload failed (bucket missing?)" },
      { status: 500 }
    );
  }

  const { data: publicUrl } = supabaseServer.storage.from(bucket).getPublicUrl(data.path);
  return NextResponse.json({ ok: true, url: publicUrl.publicUrl });
}
