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
  const [isRegister, setIsRegister] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

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
    <main className="auth-shell fade-up">
      <section className="auth-login-card">
        <header className="auth-login-header">
          <h1>{isRegister ? "Sign up" : "Log in"}</h1>
          <button
            type="button"
            className="auth-close-btn"
            onClick={() => router.push("/")}
            aria-label="Tutup halaman login"
          >
            x
          </button>
        </header>

        <div className="auth-divider" />

        <form
          className="auth-login-form"
          onSubmit={isRegister ? onRegister : onLogin}
        >
          {isRegister ? (
            <input
              type="text"
              placeholder="Nama"
              value={registerName}
              onChange={(event) => setRegisterName(event.target.value)}
              required
            />
          ) : null}

          <input
            type="email"
            placeholder="E-mail"
            value={isRegister ? registerEmail : loginEmail}
            onChange={(event) =>
              isRegister
                ? setRegisterEmail(event.target.value)
                : setLoginEmail(event.target.value)
            }
            required
          />

          <label className="auth-password-row">
            <input
              type={
                isRegister
                  ? showRegisterPassword
                    ? "text"
                    : "password"
                  : showLoginPassword
                    ? "text"
                    : "password"
              }
              placeholder="Password"
              value={isRegister ? registerPassword : loginPassword}
              onChange={(event) =>
                isRegister
                  ? setRegisterPassword(event.target.value)
                  : setLoginPassword(event.target.value)
              }
              required
              minLength={isRegister ? 6 : undefined}
            />
            <button
              type="button"
              className="auth-eye-btn"
              onClick={() =>
                isRegister
                  ? setShowRegisterPassword((current) => !current)
                  : setShowLoginPassword((current) => !current)
              }
              aria-label="Tampilkan atau sembunyikan password"
            >
              {isRegister
                ? showRegisterPassword
                  ? "Hide"
                  : "Show"
                : showLoginPassword
                  ? "Hide"
                  : "Show"}
            </button>
          </label>

          {!isRegister ? (
            <button type="button" className="auth-inline-link" onClick={() => setMessage("Fitur reset password segera hadir.")}>
              Forgot your password?
            </button>
          ) : null}

          <button className="auth-primary-btn" type="submit" disabled={loading}>
            {loading ? "Memproses..." : isRegister ? "Sign up" : "Login"}
          </button>
        </form>

        {message ? <p className="status-line auth-status">{message}</p> : null}

        <div className="auth-divider" />

        <footer className="auth-footer">
          <span>{isRegister ? "Already have an account?" : "Don't have an account?"}</span>
          <button
            type="button"
            className="auth-inline-link"
            disabled={loading}
            onClick={() => {
              setIsRegister((current) => !current);
              setMessage("");
            }}
          >
            {isRegister ? "Log in" : "Sign up"}
          </button>
        </footer>
      </section>
    </main>
  );
}
