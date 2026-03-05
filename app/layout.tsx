import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { readSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "AI Homework Helper",
  description: "Solve homework with AI step-by-step.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await readSession();

  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase());

  const isAdmin =
    session?.email && adminEmails.includes(session.email.toLowerCase());

  return (
    <html lang="en">
      <body>
        <div className="container">
          {/* Navbar */}
          <div className="nav">
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Link href="/" style={{ fontWeight: 800 }}>
                AI Homework Helper
              </Link>

              <span className="badge">SaaS</span>
            </div>

            <div className="navlinks">
              <Link href="/pricing">Pricing</Link>

              <Link href="/blog">Blog</Link>

              <Link href="/privacy">Privacy</Link>

              <Link href="/terms">Terms</Link>

              {session ? (
                <>
                  <Link href="/dashboard">Dashboard</Link>

                  {isAdmin && <Link href="/admin">Admin</Link>}

                  <form
                    action="/api/auth/logout"
                    method="POST"
                    style={{ margin: 0 }}
                  >
                    <button className="btn" type="submit">
                      Logout
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn">
                    Login
                  </Link>

                  <Link href="/register" className="btn">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>

          {children}

          <div className="hr" />

          <p className="muted" style={{ fontSize: 12 }}>
            © {new Date().getFullYear()} AI Homework Helper
          </p>
        </div>
      </body>
    </html>
  );
}