"use client";

import { useState } from "react";

export default function SolveBox() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  async function onSolve() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      // ✅ SAFE: always read as text first
      const raw = await res.text();

      // ✅ Try parse JSON, otherwise show raw text (HTML/error/empty)
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = { error: raw || "Empty response from server" };
      }

      if (!res.ok) throw new Error(data?.error || "Request failed");

      setResult(data.result ?? "");
      setRemaining(data.remaining ?? null);
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <h3 style={{ marginTop: 0 }}>Ask a Question</h3>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Example: Solve 2x + 5 = 17, show steps."
      />

      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginTop: 10,
          flexWrap: "wrap",
        }}
      >
        <button
          className="btn"
          onClick={onSolve}
          disabled={loading || prompt.trim().length < 3}
        >
          {loading ? "Solving..." : "Solve with AI"}
        </button>

        {remaining !== null && (
          <span className="muted">
            Free remaining today: <b>{remaining}</b>
          </span>
        )}
      </div>

      {error && (
        <div className="card" style={{ marginTop: 12 }}>
          <h4 style={{ marginTop: 0 }}>Error</h4>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.6 }}>
            {error}
          </pre>
        </div>
      )}

      {result && (
        <div className="card" style={{ marginTop: 12 }}>
          <h4 style={{ marginTop: 0 }}>Result</h4>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.6 }}>
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}