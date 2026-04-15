"use client";

import Link from "next/link";
import { useState } from "react";
import { DonorExperience } from "../../components/DonorExperience";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "DONOR" | "ADMIN";
};

const SESSION_TOKEN_KEY = "donasi-track-session-token";
const SESSION_USER_KEY = "donasi-track-session-user";

function readDonorSession(): { token: string; user: AuthUser | null; message: string } {
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
    if (parsed.role !== "DONOR") {
      return { token: "", user: null, message: "Akun ini bukan DONOR. Silakan gunakan halaman admin." };
    }

    return { token: storedToken, user: parsed, message: "" };
  } catch {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
    return { token: "", user: null, message: "Silakan login terlebih dulu dari halaman autentikasi." };
  }
}

export default function DonorPage() {
  const [session, setSession] = useState(readDonorSession);
  const [message, setMessage] = useState(session.message);

  function onLogout() {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
    setSession({ token: "", user: null, message: "" });
    setMessage("Sesi donatur telah keluar");
  }

  return (
    <main className="container section fade-up">
      <div className="header-stack">
        <p className="badge">Donor Console</p>
        <h1>Interface Donatur</h1>
        <p className="muted">Eksplorasi kampanye, kirim donasi, dan pantau timeline bantuan.</p>
      </div>

      {!session.token || !session.user ? (
        <section className="card" style={{ maxWidth: 520, marginBottom: 12 }}>
          <h3>Akses Donatur</h3>
          <p className="muted">{message || "Sesi tidak ditemukan."}</p>
          <Link href="/auth" className="btn brand" style={{ marginTop: 8 }}>
            Ke Halaman Login / Daftar
          </Link>
          {message ? <p className="status-line">{message}</p> : null}
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
          <DonorExperience authToken={session.token} />
          {message ? <p className="status-line">{message}</p> : null}
        </>
      )}
    </main>
  );
}
