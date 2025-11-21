import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { fileName, folder } = await req.json();

    if (!fileName) {
      return NextResponse.json(
        { error: "fileName is required" },
        { status: 400 }
      );
    }

    const bucket = process.env.SUPABASE_BUCKET_NAME!;
    // сделаем путь вида: items/время-имяФайла
    const filePath = `${folder || "items"}/${Date.now()}-${fileName}`;

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(filePath);

    if (error || !data) {
      console.error("Supabase signed url error:", error);
      return NextResponse.json(
        { error: error?.message || "Failed to create signed URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      bucket,
      path: data.path,       // путь файла в бакете
      signedUrl: data.signedUrl, // URL, куда будем делать PUT
      token: data.token,     // можно игнорить
    });
  } catch (err: any) {
    console.error("signed-upload route error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
