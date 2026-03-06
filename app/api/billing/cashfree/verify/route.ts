import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cfGetOrder } from "@/lib/cashfree";
import { readSession } from "@/lib/auth";

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export async function POST(req: Request) {
  const session = await readSession();
  if (!session) return NextResponse.redirect(new URL("/login?next=/pricing", req.url));

  const form = await req.formData();
  const orderId = String(form.get("orderId") || "");
  if (!orderId) return NextResponse.redirect(new URL("/pricing", req.url));

  // Ensure order belongs to user
  const payment = await prisma.payment.findFirst({ where: { orderId } });
  if (!payment || payment.userId !== session.uid) {
    return NextResponse.redirect(new URL("/pricing", req.url));
  }

  const order = await cfGetOrder(orderId);

  if (order.order_status === "PAID") {
    // Mark payment + upgrade plan for 30 days from now (or extend if already paid)
    const now = new Date();
    const current = await prisma.user.findUnique({ where: { id: session.uid } });
    const base = current?.planUntil && current.planUntil > now ? current.planUntil : now;
    const newUntil = addDays(base, 30);

    await prisma.$transaction([
  prisma.payment.updateMany({
    where: { orderId },
    data: { status: "PAID" },
  }),
      prisma.user.update({
        where: { id: session.uid },
        data: { plan: payment.plan, planUntil: newUntil },
      }),
    ]);

    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (order.order_status === "ACTIVE") {
    return NextResponse.redirect(new URL(`/billing/return?order_id=${encodeURIComponent(orderId)}`, req.url));
  }

  // EXPIRED/TERMINATED etc
  await prisma.payment.update({ where: { orderId }, data: { status: "FAILED" } });
  return NextResponse.redirect(new URL("/pricing", req.url));
}
