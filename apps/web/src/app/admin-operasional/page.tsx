"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminOperationalFieldApp } from "../../components/AdminOperationalFieldApp";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "DONOR" | "ADMIN";
};

const SESSION_TOKEN_KEY = "donasi-track-session-token";
const SESSION_USER_KEY = "donasi-track-session-user";

function readAdminSession(): { token: string; user: AuthUser | null; message: string } {
  if (typeof window === "undefined") {
    return { token: "", user: null, message: "" };
  }

  const storedToken = localStorage.getItem(SESSION_TOKEN_KEY) || "";
  const storedUser = localStorage.getItem(SESSION_USER_KEY);

  if (!storedToken || !storedUser) {
    return { token: "", user: null, message: "Silakan login terlebih dulu dari halaman autentikasi." };
  }

  try {
    const parsed = JSON.parse(storedUser) as AuthUser;
    if (parsed.role !== "ADMIN") {
      return { token: "", user: null, message: "Akun ini bukan ADMIN." };
    }

    return { token: storedToken, user: parsed, message: "" };
  } catch {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
    return { token: "", user: null, message: "Silakan login terlebih dulu dari halaman autentikasi." };
  }
}

export default function AdminOperationalPage() {
  const [session, setSession] = useState(readAdminSession);
  const [message, setMessage] = useState(session.message);

  function onLogout() {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
    setSession({ token: "", user: null, message: "" });
    setMessage("Sesi admin operasional telah keluar");
  }

  return (
    <main className="container section">
      <h1 style={{ fontFamily: "var(--font-heading)", marginBottom: 10 }}>Operasional Admin</h1>
      <p className="muted" style={{ marginBottom: 10 }}>
        Scan QR, update status bantuan, geolocation, dan sinkronisasi offline.
      </p>

      {!session.token || !session.user ? (
        <section className="card" style={{ maxWidth: 520, marginBottom: 12 }}>
          <h3>Akses Admin Operasional</h3>
          <p className="muted">{message || "Sesi tidak ditemukan."}</p>
          <Link href="/auth" className="btn brand" style={{ marginTop: 8 }}>
            Ke Halaman Login / Daftar
          </Link>
          {message ? <p className="muted" style={{ marginTop: 8 }}>{message}</p> : null}
        </section>
      ) : (
        <>
          <div className="panel" style={{ marginBottom: 12 }}>
            <strong>{session.user.name}</strong>
            <p className="muted">
              {session.user.email} ({session.user.role})
            </p>
            <button className="btn" style={{ marginTop: 8 }} onClick={onLogout}>
              Logout
            </button>
          </div>
          <AdminOperationalFieldApp authToken={session.token} />
          {message ? <p className="muted" style={{ marginTop: 8 }}>{message}</p> : null}
        </>
      )}
    </main>
  );
}
