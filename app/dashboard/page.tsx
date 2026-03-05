import { readSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SolveBox from "./solvebox";

export default async function DashboardPage() {
  const session = await readSession();
  const user = session ? await prisma.user.findUnique({ where: { id: session.uid } }) : null;
  const now = new Date();
  const activePaid = user?.plan !== "FREE" && user?.planUntil && user.planUntil > now;

  return (
    <main className="card">
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      <p className="muted">
        Logged in as <b>{session?.email}</b>
      </p>
      <p className="muted">
        Plan: <b>{activePaid ? user?.plan : "FREE"}</b>
        {activePaid && user?.planUntil ? (
          <> • Valid till: <b>{user.planUntil.toISOString().slice(0,10)}</b></>
        ) : null}
      </p>
      {!activePaid && (
        <p className="muted" style={{ fontSize: 13 }}>
          Free plan active. Upgrade from <a href="/pricing">Pricing</a>.
        </p>
      )}
      <SolveBox />
    </main>
  );
}
