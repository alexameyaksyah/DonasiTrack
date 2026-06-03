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

const EMPTY_SESSION: { token: string; user: AuthUser | null; message: string } = {
  token: "",
  user: null,
  message: "",
};

export default function DonorPage() {
  const [session, setSession] = useState(() => readDonorSession());
  const [flashMessage, setFlashMessage] = useState("");
  
  

  function onLogout() {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
    setSession(EMPTY_SESSION);
    setFlashMessage("Sesi donatur telah keluar");
  }

  return (
    <main className="admin-shell fade-up">
      <aside className="console-sidebar">
        <div className="console-brand">DonasiTrack</div>
        <p className="console-caption">Menu Donatur</p>
        <nav className="console-menu">
          <Link href="/donatur" className="console-link active">
            <span className="console-link-icon">DB</span>
            Dashboard
          </Link>
          <Link href="/tracking" className="console-link">
            <span className="console-link-icon">TR</span>
            Tracking
          </Link>
        </nav>
      </aside>

      <section className="console-main">
        <div className="console-topbar">
          <div>
            <h1>User Dashboard</h1>
            <p>Kelola donasi dan tracking bantuan secara realtime.</p>
          </div>
          <div className="console-user-pill">{session.user?.name ?? "Guest"}</div>
        </div>

        {!session.token || !session.user ? (
          <section className="console-surface">
            <h2>Akses Donatur</h2>
            <p className="console-muted">{session.message || flashMessage || "Sesi tidak ditemukan."}</p>
            <Link href="/auth" className="console-btn info" style={{ marginTop: 12 }}>
              Ke Halaman Login / Daftar
            </Link>
            {flashMessage ? <p className="status-line">{flashMessage}</p> : null}
          </section>
        ) : (
          <>
            <section className="console-kpis" style={{ marginBottom: 16 }}>
              <article className="console-surface">
                <p className="console-label">Nama Akun</p>
                <p className="console-value" style={{ fontSize: "1.4rem" }}>{session.user.name}</p>
                <p className="console-muted">{session.user.email}</p>
              </article>
              <article className="console-surface">
                <p className="console-label">Role</p>
                <p className="console-value" style={{ fontSize: "1.4rem" }}>{session.user.role}</p>
                <p className="console-tag">Akses Donor Aktif</p>
              </article>
              <article className="console-surface">
                <p className="console-label">Sesi</p>
                <p className="console-value" style={{ fontSize: "1.4rem" }}>Online</p>
                <button className="console-btn danger" style={{ marginTop: 10 }} onClick={onLogout}>
                  Logout
                </button>
              </article>
            </section>

            <DonorExperience authToken={session.token} />
            {flashMessage ? <p className="status-line">{flashMessage}</p> : null}
          </>
        )}
      </section>
    </main>
  );
}
