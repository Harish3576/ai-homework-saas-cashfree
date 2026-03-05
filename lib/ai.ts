type Provider = "openai" | "groq";

function provider(): Provider {
  const env = (process.env.AI_PROVIDER || "").toLowerCase();
  if (env === "openai" || env === "groq") return env;
  if (process.env.GROQ_API_KEY) return "groq";
  return "openai";
}

export async function solveWithAI(prompt: string): Promise<string> {
  const p = provider();
  if (p === "groq") return solveGroq(prompt);
  return solveOpenAI(prompt);
}

async function solveOpenAI(prompt: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY missing");
  // Uses OpenAI Responses API compatible call style via fetch to keep dependencies minimal.
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      input: [
        {
          role: "system",
          content: "You are a helpful tutor. Provide step-by-step solution, then final answer. Keep it clear and concise."
        },
        { role: "user", content: prompt }
      ]
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${t}`);
  }
  const data = await res.json();
  // data.output_text is common; otherwise parse content.
  return data.output_text ?? JSON.stringify(data);
}

async function solveGroq(prompt: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY missing");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a helpful tutor. Provide step-by-step solution, then final answer. Keep it clear and concise." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Groq error: ${res.status} ${t}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "No response";
}
