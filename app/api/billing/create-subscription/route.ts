import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";

/**
 * This is a stub route.
 * You can wire Cashfree/Stripe here and then redirect to payment link.
 */
export async function POST(req: Request) {
  const session = await readSession();
  if (!session) return NextResponse.redirect(new URL("/login?next=/pricing", req.url));

  // TODO: Create payment session (Cashfree/Stripe) and redirect.
  return NextResponse.json({
    ok: false,
    message: "Billing not wired yet. Tell me if you want Cashfree or Stripe and I will plug it in."
  }, { status: 501 });
}
