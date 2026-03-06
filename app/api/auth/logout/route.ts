import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  clearSessionCookie();

  const baseUrl =
    process.env.APP_BASE_URL ||
    "https://https-github-com-harish3576-ai-homework.onrender.com";

  return NextResponse.redirect(`${baseUrl}/`);
}