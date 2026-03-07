import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { canSolve } from "@/lib/limits";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await readSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = await canSolve(session);
    if (!limit.ok) {
      return NextResponse.json(
        {
          error: "Daily free limit reached. Upgrade to Pro.",
          remaining: limit.remaining,
        },
        { status: 429 }
      );
    }

    const form = await req.formData();
    const file = form.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image size must be under 8MB." },
        { status: 400 }
      );
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY missing in environment variables." },
        { status: 500 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const imageUrl = `data:${file.type};base64,${base64}`;

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful tutor. Read the homework question from the image carefully. Then solve it step by step in simple student-friendly language. If the image is unclear, say exactly what part is unclear.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Read the question from this image and solve it. Return the answer in this format:\n\nQuestion Detected:\n...\n\nStep-by-step Solution:\n...\n\nFinal Answer:\n...",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        temperature: 0.2,
      }),
    });

    const raw = await aiRes.text();
    let data: any = null;

    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      return NextResponse.json(
        { error: raw || "Invalid AI response." },
        { status: 500 }
      );
    }

    if (!aiRes.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Image solve failed." },
        { status: 500 }
      );
    }

    const result =
      data?.choices?.[0]?.message?.content?.trim() ||
      "No answer generated from image.";

    await prisma.solve.create({
      data: {
        userId: session.uid,
        prompt: `[Image Upload] ${file.name}`,
        result,
      },
    });

    return NextResponse.json({
      result,
      remaining: limit.remaining,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}