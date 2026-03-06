import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cfGetOrder } from "@/lib/cashfree";
import { readSession } from "@/lib/auth";

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function POST(req: Request) {
  try {
    const session = await readSession();

    if (!session) {
      const baseUrl =
        process.env.APP_BASE_URL?.trim() ||
        "https://https-github-com-harish3576-ai-homework.onrender.com";

      return NextResponse.redirect(new URL("/login?next=/pricing", baseUrl));
    }

    const form = await req.formData();
    const orderId = String(form.get("orderId") || "").trim();

    if (!orderId) {
      const baseUrl =
        process.env.APP_BASE_URL?.trim() ||
        "https://https-github-com-harish3576-ai-homework.onrender.com";

      return NextResponse.redirect(new URL("/pricing", baseUrl));
    }

    // Ensure order belongs to current user
    const payment = await prisma.payment.findFirst({
      where: { orderId },
    });

    if (!payment || payment.userId !== session.uid) {
      const baseUrl =
        process.env.APP_BASE_URL?.trim() ||
        "https://https-github-com-harish3576-ai-homework.onrender.com";

      return NextResponse.redirect(new URL("/pricing", baseUrl));
    }

    const order = await cfGetOrder(orderId);

    if (order.order_status === "PAID") {
      const now = new Date();
      const currentUser = await prisma.user.findUnique({
        where: { id: session.uid },
      });

      const base =
        currentUser?.planUntil && currentUser.planUntil > now
          ? currentUser.planUntil
          : now;

      const newUntil = addDays(base, 30);

      await prisma.$transaction([
        prisma.payment.updateMany({
          where: { orderId },
          data: { status: "PAID" },
        }),
        prisma.user.update({
          where: { id: session.uid },
          data: {
            plan: payment.plan,
            planUntil: newUntil,
          },
        }),
      ]);

      const baseUrl =
        process.env.APP_BASE_URL?.trim() ||
        "https://https-github-com-harish3576-ai-homework.onrender.com";

      return NextResponse.redirect(new URL("/dashboard", baseUrl));
    }

    if (order.order_status === "ACTIVE") {
      const baseUrl =
        process.env.APP_BASE_URL?.trim() ||
        "https://https-github-com-harish3576-ai-homework.onrender.com";

      return NextResponse.redirect(
        new URL(`/billing/return?order_id=${encodeURIComponent(orderId)}`, baseUrl)
      );
    }

    // EXPIRED / TERMINATED / other failed states
    await prisma.payment.updateMany({
      where: { orderId },
      data: { status: "FAILED" },
    });

    const baseUrl =
      process.env.APP_BASE_URL?.trim() ||
      "https://https-github-com-harish3576-ai-homework.onrender.com";

    return NextResponse.redirect(new URL("/pricing", baseUrl));
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Payment verification failed" },
      { status: 500 }
    );
  }
}