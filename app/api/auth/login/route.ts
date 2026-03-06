import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSessionCookie } from "@/lib/auth";

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  next: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const parsed = Schema.safeParse({
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
      next: form.get("next") ? String(form.get("next")) : undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email/password" }, { status: 400 });
    }

    const { email, password, next } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await createSessionCookie({
      uid: user.id,
      email: user.email,
      plan: user.plan as "FREE" | "PRO" | "PREMIUM",
    });

    const baseUrl =
      process.env.APP_BASE_URL ||
      "https://https-github-com-harish3576-ai-homework.onrender.com";

    const safeNext = next && next.startsWith("/") ? next : "/dashboard";

    return NextResponse.redirect(`${baseUrl}${safeNext}`);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Login failed" },
      { status: 500 }
    );
  }
}