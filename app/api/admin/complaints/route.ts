import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/server";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const snap = await adminDb
    .collection("complaints")
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  const complaints = await Promise.all(
    snap.docs.map(async (d) => {
      const data = d.data() as any;
      let postTitle = data.postTitle ?? null;
      let postStatus = data.postStatus ?? null;
      let postPhoto: string | null = null;
      let postSnippet: string | null = null;
      let blockedByEmail: string | null = null;
      let closedByEmail: string | null = null;

      // fetch live post data if not stored
      if ((!postTitle || !postStatus) && data.postId) {
        try {
          const postSnap = await adminDb.collection("posts").doc(data.postId).get();
          if (postSnap.exists) {
            const postData = postSnap.data() as any;
            postTitle = postTitle || postData?.title || null;
            postStatus = postStatus || postData?.status || null;
            if (Array.isArray(postData?.photos) && postData.photos.length) {
              postPhoto = postData.photos[0];
            }
            const raw = (postData?.description || postData?.descriptionPosts || "")?.toString?.() ?? "";
            postSnippet = raw.length > 400 ? `${raw.slice(0, 400)}…` : raw;
          }
        } catch {
          // ignore secondary lookup errors
        }
      }

      if (data.blockedByAdminId) {
        try {
          const userSnap = await adminDb.collection("users").doc(data.blockedByAdminId).get();
          const userData = userSnap.data() as any;
          if (userData?.email) blockedByEmail = userData.email;
        } catch {
          // ignore lookup
        }
      }

      if (data.closedByAdminId) {
        try {
          const userSnap = await adminDb.collection("users").doc(data.closedByAdminId).get();
          const userData = userSnap.data() as any;
          if (userData?.email) closedByEmail = userData.email;
        } catch {
          // ignore lookup
        }
      }

      return {
        id: d.id,
        postId: data.postId,
        userId: data.userId ?? null,
        reporterName: data.reporterName ?? null,
        reporterEmail: data.reporterEmail ?? null,
        reason: data.reason ?? "",
        status: data.status ?? "accepted",
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
        postTitle,
        postStatus,
        postSnippet,
        postPhoto,
        blockReason: data.blockReason ?? null,
        blockedByEmail,
        blockedByAdminId: data.blockedByAdminId ?? null,
        blockedAt: data.blockedAt?.toDate ? data.blockedAt.toDate().toISOString() : null,
        closedByAdminId: data.closedByAdminId ?? null,
        closedByEmail,
        closedAt: data.closedAt?.toDate ? data.closedAt.toDate().toISOString() : null,
      };
    })
  );

  return NextResponse.json({ ok: true, complaints });
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id, status, blockReason } = await req.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }

    if (status && !["accepted", "in_review", "closed"].includes(status)) {
      return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 400 });
    }

    const complaintRef = adminDb.collection("complaints").doc(id);
    const complaintSnap = await complaintRef.get();
    if (!complaintSnap.exists) {
      return NextResponse.json({ ok: false, error: "Complaint not found" }, { status: 404 });
    }
    const complaint = complaintSnap.data() as any;

    const now = new Date();
    const update: any = {
      updatedAt: now,
    };
    if (status) {
      update.status = status;
      if (status === "closed") {
        update.closedByAdminId = user.uid;
        update.closedAt = now;
      }
    }
    await complaintRef.update(update);

    if (blockReason) {
      if (!complaint.postId) {
        return NextResponse.json(
          { ok: false, error: "Невозможно заблокировать: пост не найден" },
          { status: 400 }
        );
      }
      // Save block reason with postId, complaintId, and adminId
      await Promise.all([
        complaintRef.update({
          blockReason,
          blockedByAdminId: user.uid,
          blockedAt: now,
          status: "closed",
          closedByAdminId: user.uid,
          closedAt: now,
        }),
        adminDb.collection("posts").doc(complaint.postId).update({
          status: "hidden",
          blockedReason: blockReason,
          blockedBy: user.uid,
          blockedComplaintId: complaintRef.id,
          blockedAt: now,
          updatedAt: now,
        }),
      ]);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Update complaint error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to update complaint" },
      { status: 500 }
    );
  }
}
