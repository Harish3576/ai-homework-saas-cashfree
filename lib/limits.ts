import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/auth";

export async function canSolve(session: SessionPayload) {
  // If user plan expired, treat as FREE
  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  const now = new Date();
  const paidActive = user?.plan !== "FREE" && user?.planUntil && user.planUntil > now;

  if (paidActive) return { ok: true as const, remaining: null as number | null };

  // FREE: 5 solves per day
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const count = await prisma.solve.count({
    where: { userId: session.uid, createdAt: { gte: start, lte: end } },
  });

  const limit = 5;
  const remaining = Math.max(0, limit - count);
  return { ok: remaining > 0, remaining };
}
