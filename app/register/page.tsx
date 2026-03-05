export default function RegisterPage() {
  return (
    <main className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>Create Account</h1>
      <form action="/api/auth/register" method="POST">
        <label className="muted">Email</label>
        <input className="input" name="email" type="email" required />
        <div style={{ height: 10 }} />
        <label className="muted">Password</label>
        <input className="input" name="password" type="password" minLength={6} required />
        <div style={{ height: 14 }} />
        <button className="btn" type="submit">Register</button>
      </form>
      <p className="muted" style={{ marginTop: 14, fontSize: 13 }}>
        Already have an account? <a href="/login">Login</a>
      </p>
    </main>
  );
}
