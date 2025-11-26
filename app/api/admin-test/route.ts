import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/server";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const list = await adminAuth.listUsers(1);
    return NextResponse.json({
      ok: true,
      usersCount: list.users.length,
    });
  } catch (error: any) {
    console.error("Admin test error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "error" },
      { status: 500 }
    );
  }
}
