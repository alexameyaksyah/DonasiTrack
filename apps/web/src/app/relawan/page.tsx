"use client";

import { FormEvent, useEffect, useState } from "react";
import { VolunteerFieldApp } from "../../components/VolunteerFieldApp";
import { API_URL } from "../../lib/api";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "DONOR" | "VOLUNTEER" | "ADMIN";
};

const VOLUNTEER_TOKEN_KEY = "donasi-track-volunteer-token";
const VOLUNTEER_USER_KEY = "donasi-track-volunteer-user";

export default function VolunteerPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem(VOLUNTEER_TOKEN_KEY);
    const storedUser = localStorage.getItem(VOLUNTEER_USER_KEY);

    if (storedToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as AuthUser;
        if (parsed.role === "VOLUNTEER") {
          setToken(storedToken);
          setUser(parsed);
        }
      } catch {
        localStorage.removeItem(VOLUNTEER_TOKEN_KEY);
        localStorage.removeItem(VOLUNTEER_USER_KEY);
      }
    }
  }, []);

  async function onLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as { message?: string; token?: string; user?: AuthUser };
      if (!response.ok || !data.token || !data.user) {
        setMessage(data.message || "Login gagal");
        return;
      }

      if (data.user.role !== "VOLUNTEER") {
        setMessage("Akun ini bukan Relawan. Ubah role di Prisma Studio atau login di halaman donatur.");
        return;
      }

      localStorage.setItem(VOLUNTEER_TOKEN_KEY, data.token);
      localStorage.setItem(VOLUNTEER_USER_KEY, JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setPassword("");
      setMessage(`Login berhasil sebagai ${data.user.name}`);
    } catch {
      setMessage("Gagal terhubung ke server API");
    } finally {
      setLoading(false);
    }
  }

  function onLogout() {
    localStorage.removeItem(VOLUNTEER_TOKEN_KEY);
    localStorage.removeItem(VOLUNTEER_USER_KEY);
    setToken("");
    setUser(null);
    setMessage("Sesi relawan telah keluar");
  }

  return (
    <main className="container section">
      <h1 style={{ fontFamily: "var(--font-heading)", marginBottom: 10 }}>Interface Relawan</h1>
      <p className="muted" style={{ marginBottom: 10 }}>
        Login dengan email relawan untuk scan QR, update status bantuan, geolocation, dan sinkronisasi offline.
      </p>

      {!token || !user ? (
        <section className="card" style={{ maxWidth: 520, marginBottom: 12 }}>
          <h3>Login Relawan</h3>
          <p className="muted">Akun donatur/admin tidak dapat mengakses halaman ini.</p>
          <form className="form" style={{ marginTop: 8 }} onSubmit={onLogin}>
            <input
              type="email"
              placeholder="Email relawan"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button className="btn brand" type="submit" disabled={loading}>
              {loading ? "Memproses..." : "Login Relawan"}
            </button>
          </form>
          {message ? <p className="muted" style={{ marginTop: 8 }}>{message}</p> : null}
        </section>
      ) : (
        <>
          <div className="panel" style={{ marginBottom: 12 }}>
            <strong>{user.name}</strong>
            <p className="muted">
              {user.email} ({user.role})
            </p>
            <button className="btn" style={{ marginTop: 8 }} onClick={onLogout}>
              Logout
            </button>
          </div>
          <VolunteerFieldApp authToken={token} />
          {message ? <p className="muted" style={{ marginTop: 8 }}>{message}</p> : null}
        </>
      )}
    </main>
  );
}
