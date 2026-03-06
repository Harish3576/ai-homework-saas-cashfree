import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/cashfree";

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-webhook-signature") || "";
    const timestamp = req.headers.get("x-webhook-timestamp") || "";

    const rawBody = await req.text();

    if (!signature || !timestamp) {
      return NextResponse.json(
        { error: "Missing signature headers" },
        { status: 400 }
      );
    }

    const ok = verifyWebhookSignature(rawBody, timestamp, signature);
    if (!ok) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody) as any;

    const type = event?.type as string | undefined;
    const orderId = event?.data?.order?.order_id as string | undefined;
    const paymentStatus = event?.data?.payment?.payment_status as string | undefined;
    const cfPaymentId = event?.data?.payment?.cf_payment_id as string | undefined;

    if (!orderId) {
      return NextResponse.json({ ok: true });
    }

    const payment = await prisma.payment.findFirst({
      where: { orderId },
    });

    if (!payment) {
      return NextResponse.json({ ok: true });
    }

    let status: "PAID" | "FAILED" | "DROPPED" | null = null;

    if (type === "PAYMENT_SUCCESS_WEBHOOK" || paymentStatus === "SUCCESS") {
      status = "PAID";
    }

    if (type === "PAYMENT_FAILED_WEBHOOK" || paymentStatus === "FAILED") {
      status = "FAILED";
    }

    if (
      type === "PAYMENT_USER_DROPPED_WEBHOOK" ||
      paymentStatus === "USER_DROPPED"
    ) {
      status = "DROPPED";
    }

    if (status) {
      await prisma.payment.updateMany({
        where: { orderId },
        data: {
          status,
          cfPaymentId: cfPaymentId ? String(cfPaymentId) : undefined,
        },
      });

      if (status === "PAID") {
        const now = new Date();
        const user = await prisma.user.findUnique({
          where: { id: payment.userId },
        });

        const base =
          user?.planUntil && user.planUntil > now ? user.planUntil : now;

        const newUntil = new Date(base);
        newUntil.setDate(newUntil.getDate() + 30);

        await prisma.user.update({
          where: { id: payment.userId },
          data: {
            plan: payment.plan,
            planUntil: newUntil,
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Webhook failed" },
      { status: 500 }
    );
  }
}