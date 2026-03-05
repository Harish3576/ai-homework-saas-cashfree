import Link from "next/link";

export default function HomePage() {
  return (
    <main className="card">
      <h1 style={{ marginTop: 0, fontSize: 34 }}>Solve Homework in Seconds</h1>
      <p className="muted" style={{ fontSize: 16, lineHeight: 1.6 }}>
        Paste your question and get a clear step-by-step solution. Free plan includes daily limits; upgrade for unlimited solves.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
        <Link className="btn" href="/dashboard">Open Dashboard</Link>
        <Link className="btn" href="/pricing">See Pricing</Link>
      </div>

      <div className="hr" />
      <div className="row">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Step-by-step Answers</h3>
          <p className="muted">Not just the final answer—learn how to reach it.</p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Fast + Reliable</h3>
          <p className="muted">Use Groq/OpenAI as the engine. Switch anytime via env.</p>
        </div>
      </div>
    </main>
  );
}
