export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const next = searchParams?.next || "/dashboard";
  return (
    <main className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>Login</h1>
      <form action="/api/auth/login" method="POST">
        <label className="muted">Email</label>
        <input className="input" name="email" type="email" required />
        <div style={{ height: 10 }} />
        <label className="muted">Password</label>
        <input className="input" name="password" type="password" required />
        <input type="hidden" name="next" value={next} />
        <div style={{ height: 14 }} />
        <button className="btn" type="submit">Login</button>
      </form>
      <p className="muted" style={{ marginTop: 14, fontSize: 13 }}>
        Don&apos;t have an account? <a href="/register">Register</a>
      </p>
    </main>
  );
}
