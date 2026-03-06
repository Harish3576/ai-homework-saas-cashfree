import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSessionCookie } from "@/lib/auth";

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const form = await request.formData();

    const parsed = Schema.safeParse({
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email/password" }, { status: 400 });
    }

    const { email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, passwordHash, plan: "FREE" },
    });

    await createSessionCookie({
      uid: user.id,
      email: user.email,
      plan: user.plan as "FREE" | "PRO" | "PREMIUM",
    });

    const baseUrl =
      process.env.APP_BASE_URL ||
      "https://https-github-com-harish3576-ai-homework.onrender.com";

    return NextResponse.redirect(`${baseUrl}/dashboard`);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Register failed" },
      { status: 500 }
    );
  }
}