import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  return NextResponse.json({ valid: true, email: user.email });
}
