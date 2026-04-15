"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "../../lib/api";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "DONOR" | "ADMIN";
};

const SESSION_TOKEN_KEY = "donasi-track-session-token";
const SESSION_USER_KEY = "donasi-track-session-user";

function redirectByRole(router: ReturnType<typeof useRouter>, role: AuthUser["role"]) {
  if (role === "ADMIN") {
    router.push("/admin");
    return;
  }

  router.push("/donatur");
}

export default function AuthPage() {
  const router = useRouter();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function onLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = (await response.json()) as { message?: string; token?: string; user?: AuthUser };
      if (!response.ok || !data.token || !data.user) {
        setMessage(data.message || "Login gagal");
        return;
      }

      localStorage.setItem(SESSION_TOKEN_KEY, data.token);
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(data.user));
      setMessage(`Login berhasil sebagai ${data.user.name}`);
      redirectByRole(router, data.user.role);
    } catch {
      setMessage("Gagal terhubung ke server API");
    } finally {
      setLoading(false);
    }
  }

  async function onRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
        }),
      });

      const data = (await response.json()) as { message?: string; token?: string; user?: AuthUser };
      if (!response.ok || !data.token || !data.user) {
        setMessage(data.message || "Registrasi gagal");
        return;
      }

      localStorage.setItem(SESSION_TOKEN_KEY, data.token);
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(data.user));
      setMessage("Registrasi berhasil. Akun baru dibuat sebagai DONOR.");
      redirectByRole(router, data.user.role);
    } catch {
      setMessage("Gagal terhubung ke server API");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container section fade-up">
      <div className="hero-card" style={{ marginBottom: 16 }}>
        <div className="header-stack">
          <p className="badge">Lavender Moon Access</p>
          <h1>Login dan Daftar Akun</h1>
          <p className="muted">
            Registrasi publik otomatis membuat akun sebagai DONOR. Jika perlu mengubah role ke ADMIN, gunakan Prisma Studio.
          </p>
        </div>

        <section className="grid" style={{ alignItems: "start" }}>
          <article className="card">
            <h3>Login</h3>
            <form className="form" style={{ marginTop: 8 }} onSubmit={onLogin}>
              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                required
              />
              <button className="btn brand" type="submit" disabled={loading}>
                {loading ? "Memproses..." : "Login"}
              </button>
            </form>
          </article>

          <article className="card">
            <h3>Daftar Akun Baru</h3>
            <p className="muted">Role pendaftaran awal: DONOR</p>
            <form className="form" style={{ marginTop: 8 }} onSubmit={onRegister}>
              <input
                type="text"
                placeholder="Nama"
                value={registerName}
                onChange={(event) => setRegisterName(event.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password minimal 6 karakter"
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.target.value)}
                required
                minLength={6}
              />
              <button className="btn" type="submit" disabled={loading}>
                {loading ? "Memproses..." : "Daftar"}
              </button>
            </form>
          </article>
        </section>
      </div>

      {message ? <p className="status-line">{message}</p> : null}
    </main>
  );
}
