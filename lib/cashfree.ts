import crypto from "crypto";

type CashfreeEnv = "TEST" | "PROD";

function cfEnv(): CashfreeEnv {
  const v = (process.env.CASHFREE_ENV || "TEST").toUpperCase();
  return v === "PROD" ? "PROD" : "TEST";
}

function cfBaseUrl() {
  return cfEnv() === "PROD" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
}

function required(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} missing in .env`);
  return v;
}

export function cashfreeHeaders(extra?: Record<string, string>) {
  const apiVersion = process.env.CASHFREE_API_VERSION || "2025-01-01";
  return {
    "content-type": "application/json",
    "x-api-version": apiVersion,
    "x-client-id": required("CASHFREE_APP_ID"),
    "x-client-secret": required("CASHFREE_SECRET_KEY"),
    ...(extra || {}),
  };
}

export async function cfCreateOrder(params: {
  orderId: string;
  amount: number;
  customer: { id: string; email: string; phone: string; name?: string | null };
  returnUrl: string;
  notifyUrl: string;
  note?: string;
}) {
  const body = {
    order_id: params.orderId,
    order_amount: Number(params.amount.toFixed(2)),
    order_currency: "INR",
    customer_details: {
      customer_id: params.customer.id,
      customer_email: params.customer.email,
      customer_phone: params.customer.phone,
      customer_name: params.customer.name || undefined,
    },
    order_meta: {
      return_url: params.returnUrl,
      notify_url: params.notifyUrl,
    },
    order_note: params.note || "Subscription purchase",
  };

  const res = await fetch(`${cfBaseUrl()}/orders`, {
    method: "POST",
    headers: cashfreeHeaders(),
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Cashfree create order failed: ${res.status} ${text}`);
  const data = JSON.parse(text);
  return data as {
    cf_order_id: string;
    order_id: string;
    order_status: string;
    payment_session_id: string;
    order_amount: number;
    order_currency: string;
  };
}

export async function cfGetOrder(orderId: string) {
  const res = await fetch(`${cfBaseUrl()}/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: cashfreeHeaders(),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Cashfree get order failed: ${res.status} ${text}`);
  return JSON.parse(text) as { order_id: string; order_status: "ACTIVE" | "PAID" | "EXPIRED" | "TERMINATED" | "TERMINATION_REQUESTED" };
}

export function cfModeForJsSdk() {
  return cfEnv() === "PROD" ? "production" : "sandbox";
}

/**
 * Webhook signature verification
 * expectedSignature := Base64Encode(HMACSHA256(timestamp + rawBody, clientSecret))
 */
export function verifyWebhookSignature(rawBody: string, timestamp: string, signature: string) {
  const secretKey = required("CASHFREE_SECRET_KEY");
  const signedPayload = `${timestamp}${rawBody}`;
  const expected = crypto.createHmac("sha256", secretKey).update(signedPayload).digest("base64");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
