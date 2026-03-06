import { readSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { CSSProperties } from "react";

function isAdmin(email: string) {
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return list.includes(email.toLowerCase());
}

type AdminUserRow = {
  id: string;
  email: string;
  plan: string;
  planUntil: Date | null;
  createdAt: Date;
  _count: {
    solves: number;
    payments: number;
  };
};

type AdminPaymentRow = {
  id: string;
  orderId: string;
  cfOrderId: string | null;
  userId: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: Date;
};

export default async function AdminPage() {
  const session = await readSession();

  if (!session) {
    return (
      <main className="card">
        <h1 style={{ marginTop: 0 }}>Admin</h1>
        <p className="muted">Please login first.</p>
        <Link className="btn" href="/login?next=/admin">
          Login
        </Link>
      </main>
    );
  }

  if (!isAdmin(session.email)) {
    return (
      <main className="card">
        <h1 style={{ marginTop: 0 }}>Access Denied</h1>
        <p className="muted">You are not allowed to view this page.</p>
        <Link className="btn" href="/dashboard">
          Go Dashboard
        </Link>
      </main>
    );
  }

  const users: AdminUserRow[] = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      plan: true,
      planUntil: true,
      createdAt: true,
      _count: { select: { solves: true, payments: true } },
    },
  });

  const payments: AdminPaymentRow[] = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      orderId: true,
      cfOrderId: true,
      userId: true,
      plan: true,
      amount: true,
      currency: true,
      status: true,
      createdAt: true,
    },
  });

  return (
    <main className="card">
      <h1 style={{ marginTop: 0 }}>Admin Panel</h1>
      <p className="muted">
        Logged in as <b>{session.email}</b>
      </p>

      <div className="hr" />
      <h2 style={{ marginTop: 0 }}>Users ({users.length})</h2>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Email</th>
              <th style={th}>Plan</th>
              <th style={th}>Valid Till</th>
              <th style={th}>Solves</th>
              <th style={th}>Payments</th>
              <th style={th}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: AdminUserRow) => (
              <tr key={u.id}>
                <td style={td}>{u.email}</td>
                <td style={td}>{u.plan}</td>
                <td style={td}>
                  {u.planUntil ? u.planUntil.toISOString().slice(0, 10) : "-"}
                </td>
                <td style={td}>{u._count.solves}</td>
                <td style={td}>{u._count.payments}</td>
                <td style={td}>{u.createdAt.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hr" />
      <h2 style={{ marginTop: 0 }}>Recent Payments (last 50)</h2>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Order ID</th>
              <th style={th}>Plan</th>
              <th style={th}>Amount</th>
              <th style={th}>Status</th>
              <th style={th}>Created</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p: AdminPaymentRow) => (
              <tr key={p.id}>
                <td style={td}>{p.orderId}</td>
                <td style={td}>{p.plan}</td>
                <td style={td}>
                  {p.currency} {p.amount}
                </td>
                <td style={td}>{p.status}</td>
                <td style={td}>{p.createdAt.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hr" />
      <Link className="btn" href="/dashboard">
        Back to Dashboard
      </Link>
    </main>
  );
}

const th: CSSProperties = {
  textAlign: "left",
  padding: "10px",
  borderBottom: "1px solid rgba(255,255,255,0.10)",
  fontSize: 13,
  color: "rgba(231,238,252,0.85)",
};

const td: CSSProperties = {
  padding: "10px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  fontSize: 13,
};