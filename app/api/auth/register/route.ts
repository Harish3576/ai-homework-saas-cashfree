import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSessionCookie } from "@/lib/auth";

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  const form = await req.formData();
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

  await createSessionCookie({ uid: user.id, email: user.email, plan: user.plan as any });

  return NextResponse.redirect(new URL("/dashboard", req.url));
}
