import Link from "next/link";

export default async function BillingReturnPage({ searchParams }: { searchParams: { order_id?: string } }) {
  const orderId = searchParams?.order_id || "";
  return (
    <main className="card">
      <h1 style={{ marginTop: 0 }}>Payment Status</h1>
      {!orderId ? (
        <p className="muted">Missing order_id in return URL.</p>
      ) : (
        <>
          <p className="muted">Checking your payment status for <b>{orderId}</b>...</p>
          <form action="/api/billing/cashfree/verify" method="POST">
            <input type="hidden" name="orderId" value={orderId} />
            <button className="btn" type="submit">Verify Payment</button>
          </form>
          <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>
            If you already paid, click Verify. Your plan will be activated immediately after verification.
          </p>
        </>
      )}
      <div className="hr" />
      <Link className="btn" href="/dashboard">Go to Dashboard</Link>
    </main>
  );
}
