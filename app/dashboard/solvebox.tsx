"use client";

import { useMemo, useState } from "react";

type Mode = "text" | "image";

export default function SolveBox() {
  const [mode, setMode] = useState<Mode>("text");
  const [prompt, setPrompt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  const imagePreview = useMemo(() => {
    if (!imageFile) return null;
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  async function onSolveText() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const raw = await res.text();
      let data: any = null;

      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        throw new Error(raw || "Invalid server response");
      }

      if (!res.ok) {
        throw new Error(data?.error || "Failed to solve question");
      }

      setResult(data.result ?? "");
      setRemaining(data.remaining ?? null);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function onSolveImage() {
    if (!imageFile) {
      setError("Please upload an image first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const res = await fetch("/api/solve-image", {
        method: "POST",
        body: formData,
      });

      const raw = await res.text();
      let data: any = null;

      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        throw new Error(raw || "Invalid server response");
      }

      if (!res.ok) {
        throw new Error(data?.error || "Failed to solve image");
      }

      setResult(data.result ?? "");
      setRemaining(data.remaining ?? null);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function copyResult() {
    if (!result) return;
    navigator.clipboard.writeText(result);
  }

  function clearAll() {
    setPrompt("");
    setImageFile(null);
    setResult(null);
    setError(null);
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h2 style={{ marginTop: 0 }}>Solve your homework</h2>
      <p className="muted" style={{ marginTop: -4 }}>
        Type a question, upload an image, or use your camera on mobile.
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <button
          className="btn"
          type="button"
          onClick={() => setMode("text")}
          style={{
            opacity: mode === "text" ? 1 : 0.75,
          }}
        >
          Text Question
        </button>

        <button
          className="btn"
          type="button"
          onClick={() => setMode("image")}
          style={{
            opacity: mode === "image" ? 1 : 0.75,
          }}
        >
          Camera / Image Upload
        </button>
      </div>

      {mode === "text" ? (
        <>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: Solve 2x + 5 = 17 and explain step by step."
            style={{ minHeight: 180 }}
          />

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
              marginTop: 14,
            }}
          >
            <button
              className="btn"
              onClick={onSolveText}
              disabled={loading || prompt.trim().length < 3}
              type="button"
            >
              {loading ? "Solving..." : "Solve with AI"}
            </button>

            <button className="btn" onClick={clearAll} type="button">
              Clear
            </button>

            {remaining !== null && (
              <span className="muted">
                Free remaining today: <b>{remaining}</b>
              </span>
            )}
          </div>
        </>
      ) : (
        <>
          <div
            className="card"
            style={{
              border: "1px dashed rgba(255,255,255,0.2)",
              marginTop: 8,
            }}
          >
            <p className="muted" style={{ marginTop: 0 }}>
              Upload a homework photo or open camera on mobile.
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <label className="btn" style={{ cursor: "pointer" }}>
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setImageFile(file);
                  }}
                  style={{ display: "none" }}
                />
              </label>

              <label className="btn" style={{ cursor: "pointer" }}>
                Use Camera
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setImageFile(file);
                  }}
                  style={{ display: "none" }}
                />
              </label>

              <button className="btn" onClick={clearAll} type="button">
                Clear
              </button>
            </div>

            {imageFile && (
              <p className="muted" style={{ marginTop: 12, marginBottom: 0 }}>
                Selected: <b>{imageFile.name}</b>
              </p>
            )}
          </div>

          {imagePreview && (
            <div className="card" style={{ marginTop: 16 }}>
              <h4 style={{ marginTop: 0 }}>Preview</h4>
              <img
                src={imagePreview}
                alt="Uploaded homework"
                style={{
                  maxWidth: "100%",
                  borderRadius: 12,
                  display: "block",
                }}
              />
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
              marginTop: 14,
            }}
          >
            <button
              className="btn"
              onClick={onSolveImage}
              disabled={loading || !imageFile}
              type="button"
            >
              {loading ? "Reading image..." : "Solve from Image"}
            </button>

            {remaining !== null && (
              <span className="muted">
                Free remaining today: <b>{remaining}</b>
              </span>
            )}
          </div>
        </>
      )}

      {error && (
        <div
          className="card"
          style={{
            marginTop: 16,
            border: "1px solid rgba(255,0,0,0.25)",
          }}
        >
          <h4 style={{ marginTop: 0 }}>Error</h4>
          <p style={{ color: "#ffb3b3", margin: 0 }}>{error}</p>
        </div>
      )}

      {result && (
        <div className="card" style={{ marginTop: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <h4 style={{ margin: 0 }}>Solution</h4>
            <button className="btn" onClick={copyResult} type="button">
              Copy Answer
            </button>
          </div>

          <pre
            style={{
              whiteSpace: "pre-wrap",
              lineHeight: 1.7,
              marginTop: 14,
              marginBottom: 0,
              fontFamily: "inherit",
            }}
          >
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}