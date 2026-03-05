import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/lib/auth";
import { canSolve } from "@/lib/limits";
import { solveWithAI } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

const Schema = z.object({
  prompt: z.string().min(3).max(8000),
});

export async function POST(req: Request) {
  try {
    const session = await readSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
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

    const prompt = parsed.data.prompt;

    const result = await solveWithAI(prompt);

    await prisma.solve.create({
      data: { userId: session.uid, prompt, result },
    });

    return NextResponse.json({ result, remaining: limit.remaining });
  } catch (err: any) {
    // ✅ Always return JSON even on server error
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}