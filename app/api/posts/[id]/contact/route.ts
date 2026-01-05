import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { buildPostUrl, sendEmail } from "@/lib/email";

export const runtime = "nodejs";

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { email, phone, message } = await req.json();
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ ok: false, error: "Message is required" }, { status: 400 });
    }

    const snap = await adminDb.collection("posts").doc(params.id).get();
    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: "Post not found" }, { status: 404 });
    }
    const data = snap.data() as any;
    let to = data?.ownerEmail || data?.userEmail || null;

    // Fallback: look up user doc by userId if present
    if (!to && data?.userId) {
      try {
        const userSnap = await adminDb.collection("users").doc(data.userId).get();
        const userData = userSnap.data() as any;
        if (userData?.email) {
          to = userData.email;
        }
      } catch (e) {
        // ignore lookup failure
      }
    }

    if (!to) {
      return NextResponse.json({ ok: false, error: "Owner email not available" }, { status: 400 });
    }

    const smtpUrl = process.env.EMAIL_SMTP_URL;
    if (!smtpUrl) {
      return NextResponse.json({ ok: false, error: "SMTP not configured" }, { status: 500 });
    }

    const visitorEmail = typeof email === "string" && email.trim() ? email.trim() : null;
    const visitorPhone = typeof phone === "string" && phone.trim() ? phone.trim() : null;
    const cleanMessage = message.trim();
    const title = data?.title ?? params.id;
    const postUrl = buildPostUrl(params.id);

    const subject = `Contact regarding your post: ${title}`;
    const textBody = `New message about your post "${title}"

Message:
${cleanMessage}

From: ${visitorEmail || "not provided"}
Phone: ${visitorPhone || "not provided"}
Link: ${postUrl}
`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0; padding: 16px; color: #1f2937; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="margin: 0 0 8px; font-size: 18px; color: #111827;">New message about your post</h2>
        <p style="margin: 0 0 12px; color: #4b5563;">"${escapeHtml(title)}"</p>

        <div style="margin: 0 0 12px; padding: 12px; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px;">
          <p style="margin: 0 0 8px; font-weight: 600; color: #111827;">Message</p>
          <p style="margin: 0; white-space: pre-wrap; color: #1f2937;">${escapeHtml(cleanMessage)}</p>
        </div>

        <div style="margin: 0 0 12px; padding: 12px; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px;">
          <p style="margin: 0 0 6px; font-weight: 600; color: #111827;">Sender</p>
          <p style="margin: 0; color: #374151;">E-pasts: ${escapeHtml(visitorEmail || "nav noradits")}</p>
          <p style="margin: 4px 0 0; color: #374151;">Phone: ${escapeHtml(visitorPhone || "not provided")}</p>
        </div>

        <a href="${postUrl}" style="display: inline-block; margin-top: 4px; padding: 10px 16px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Open post
        </a>
      </div>
    `;

    await sendEmail({
      to,
      replyTo: visitorEmail || undefined,
      subject,
      text: textBody,
      html: htmlBody,
    });

    // persist message in Firestore under posts/{id}/messages
    await adminDb
      .collection("posts")
      .doc(params.id)
      .collection("messages")
      .add({
        email: email || "",
        phone: phone || "",
        content: message.trim(),
        createdAt: new Date(),
      });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Contact owner error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Neizdevas nosutit zinu" },
      { status: 500 }
    );
  }
}
