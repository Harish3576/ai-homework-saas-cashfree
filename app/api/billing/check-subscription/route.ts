import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Simple helper to check current plan.
 * In real billing, you'd verify payment webhooks and update user.plan.
 */
export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  return NextResponse.json({ plan: user?.plan ?? "FREE" });
}
