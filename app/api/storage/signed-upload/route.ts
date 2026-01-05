import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { fileName, folder } = await req.json();

    if (!fileName) {
      return NextResponse.json({ error: "fileName ir obligats" }, { status: 400 });
    }

    const bucket = process.env.SUPABASE_BUCKET_NAME!;
    if (!supabaseServer) {
      console.error("Supabase not configured");
      return NextResponse.json({ error: "Supabase nav nokonfigurets serveri" }, { status: 500 });
    }

    // Izveido faila celu bucket ietvaros.
    const filePath = `${folder || "items"}/${Date.now()}-${fileName}`;

    const { data, error } = await supabaseServer.storage
      .from(bucket)
      .createSignedUploadUrl(filePath);

    if (error || !data) {
      console.error("Supabase signed url error:", error);
      return NextResponse.json({ error: error?.message || "Neizdevas izveidot signed URL" }, { status: 500 });
    }

    return NextResponse.json({
      bucket,
      path: data.path, // faila cels bucket ietvaros
      signedUrl: data.signedUrl, // vienreiz lietojams PUT URL
      token: data.token, // papildus informacija (nav obligata)
    });
  } catch (err: any) {
    console.error("signed-upload route error:", err);
    return NextResponse.json({ error: err.message || "Servera kluda" }, { status: 500 });
  }
}
