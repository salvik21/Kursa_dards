import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

export async function GET() {
  try {
    // пробуем получить до 1 пользователя (может быть 0 — это нормально)
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
