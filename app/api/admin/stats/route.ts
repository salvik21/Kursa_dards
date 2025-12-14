import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/server";

export const runtime = "nodejs";

type PostSummary = {
  id: string;
  title: string;
  type: string;
  status: string;
  category: string;
  placeName: string | null;
  createdAt: string | null;
};

function toCsv(rows: string[][]) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  return rows.map((row) => row.map((cell) => escape(cell ?? "")).join(",")).join("\n");
}

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const wantCsv = (searchParams.get("format") || "").toLowerCase() === "csv";

    const categoriesSnap = await adminDb.collection("categories").get();
    const categoriesMap = new Map<string, string>();
    categoriesSnap.docs.forEach((d) => categoriesMap.set(d.id, (d.data() as any)?.name ?? ""));

    const snap = await adminDb.collection("posts").orderBy("createdAt", "desc").get();

    const placeMap = new Map<string, any>();
    await Promise.all(
      snap.docs.map(async (doc) => {
        try {
          const placeSnap = await adminDb.collection("postsPlace").doc(doc.id).get();
          if (placeSnap.exists) {
            placeMap.set(doc.id, placeSnap.data());
          }
        } catch {
          // ignore lookup errors
        }
      })
    );

    const posts: PostSummary[] = snap.docs
      .map((d) => {
        const data = d.data() as any;
        const id = data.id as string | undefined;
        if (!id) return null;
        const categoryName = categoriesMap.get(data.categoryId) ?? data.categoryName ?? data.category ?? "";
        const placeData = placeMap.get(id);
        return {
          id,
          title: data.title ?? "",
          type: data.type ?? "",
          status: data.status ?? "open",
          category: categoryName,
          placeName: placeData?.placeNamePlace ?? data.placeName ?? null,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
        };
      })
      .filter(Boolean) as any[];

    const stats = {
      totalPosts: posts.length,
      lost: posts.filter((p) => p.type === "lost").length,
      found: posts.filter((p) => p.type === "found").length,
      statuses: posts.reduce<Record<string, number>>((acc, p) => {
        acc[p.status] = (acc[p.status] ?? 0) + 1;
        return acc;
      }, {}),
      lostByRegion: posts
        .filter((p) => p.type === "lost")
        .reduce<Record<string, { label: string; count: number }>>((acc, p) => {
          const label = (p.placeName || "Unspecified").trim();
          const key = label.toLowerCase();
          acc[key] = { label, count: (acc[key]?.count ?? 0) + 1 };
          return acc;
        }, {}),
    };

    const lostByRegionArray = Object.values(stats.lostByRegion).sort((a, b) => b.count - a.count);

    if (wantCsv) {
      const headers = ["id", "title", "type", "status", "category", "place", "createdAt"];
      const rows = [
        headers,
        ...posts.map((p) => [
          p.id,
          p.title,
          p.type,
          p.status,
          p.category,
          p.placeName ?? "",
          p.createdAt ?? "",
        ]),
      ];
      const csv = toCsv(rows);
      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="posts-export.csv"',
        },
      });
    }

    return NextResponse.json({
      ok: true,
      stats: {
        totalPosts: stats.totalPosts,
        lost: stats.lost,
        found: stats.found,
        statuses: stats.statuses,
        lostByRegion: lostByRegionArray,
      },
      posts,
    });
  } catch (error: any) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to build stats" },
      { status: 500 }
    );
  }
}
