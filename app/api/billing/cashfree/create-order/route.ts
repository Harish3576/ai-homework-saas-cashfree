import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cfCreateOrder, cfModeForJsSdk } from "@/lib/cashfree";

const Schema = z.object({
  plan: z.enum(["PRO", "PREMIUM"]),
});

function planAmount(plan: "PRO" | "PREMIUM") {
  return plan === "PRO" ? 199 : 499;
}

export async function POST(req: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const plan = parsed.data.plan;
  const amount = planAmount(plan);

  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  const orderId = `sub_${plan.toLowerCase()}_${session.uid}_${Date.now()}`;

  const returnUrl = `${baseUrl}/billing/return?order_id=${encodeURIComponent(orderId)}`;
  const notifyUrl = `${baseUrl}/api/cashfree/webhook`;

  // Create Cashfree order
  const order = await cfCreateOrder({
    orderId,
    amount,
    customer: {
      id: session.uid,
      email: session.email,
      phone: "9999999999", // You can store phone in user profile later
      name: session.email.split("@")[0],
    },
    returnUrl,
    notifyUrl,
    note: `${plan} plan purchase`,
  });

  // Save in DB
  await prisma.payment.create({
    data: {
      userId: session.uid,
      orderId,
      cfOrderId: String(order.cf_order_id),
      plan,
      amount,
      currency: "INR",
      status: "CREATED",
    },
  });

  return NextResponse.json({
    orderId,
    paymentSessionId: order.payment_session_id,
    mode: cfModeForJsSdk(),
  });
}
