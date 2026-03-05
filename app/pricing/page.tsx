"use client";

import Script from "next/script";
import { useState } from "react";

declare global {
  interface Window {
    Cashfree?: any;
  }
}

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function buy(plan: "PRO" | "PREMIUM") {
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/billing/cashfree/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      // ✅ Safe response handling
      const raw = await res.text();
      let data: any = null;

      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        throw new Error(raw || "Invalid server response");
      }

      if (!res.ok) {
        throw new Error(data?.error || "Failed to create order");
      }

      if (!window.Cashfree) {
        throw new Error("Cashfree SDK not loaded");
      }

      const cashfree = window.Cashfree({ mode: data.mode });

      cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_self",
      });
    } catch (e: any) {
      setMsg(e.message || "Payment error");
      setLoading(false);
    }
  }

  return (
    <main className="card">
      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        strategy="afterInteractive"
      />

      <h1 style={{ marginTop: 0 }}>Pricing</h1>
      <p className="muted">Upgrade to unlock unlimited AI solves.</p>

      <div className="row" style={{ marginTop: 14 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Free</h3>
          <p className="muted">₹0</p>
          <ul className="muted">
            <li>5 solves per day</li>
          </ul>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Pro</h3>
          <p className="muted">₹199 / month</p>

          <button className="btn" onClick={() => buy("PRO")} disabled={loading}>
            {loading ? "Loading..." : "Buy Pro"}
          </button>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Premium</h3>
          <p className="muted">₹499 / month</p>

          <button
            className="btn"
            onClick={() => buy("PREMIUM")}
            disabled={loading}
          >
            {loading ? "Loading..." : "Buy Premium"}
          </button>
        </div>
      </div>

      {msg && (
        <p style={{ color: "red", marginTop: 15 }}>
          {msg}
        </p>
      )}
    </main>
  );
}