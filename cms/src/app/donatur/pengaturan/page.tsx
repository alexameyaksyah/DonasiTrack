"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
    return { token: "", user: null, message: "Silakan login terlebih dulu." };
  }

  try {
    const parsed = JSON.parse(storedUser) as AuthUser;
    if (parsed.role !== "DONOR") {
      return { token: "", user: null, message: "Akses ditolak." };
    }
    return { token: storedToken, user: parsed, message: "" };
  } catch {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
    return { token: "", user: null, message: "Silakan login terlebih dulu." };
  }
}

const EMPTY_SESSION = { token: "", user: null, message: "" };

export default function DonorPengaturanPage() {
  const [session, setSession] = useState(EMPTY_SESSION);
  const [isReady, setIsReady] = useState(false);

  // Read session from localStorage after mount
  useEffect(() => {
    Promise.resolve().then(() => {
      const sessionData = readDonorSession();
      setSession(sessionData);
      setIsReady(true);
    });
  }, []);

  return (
    <main className="admin-shell fade-up">
      <aside className="console-sidebar">
        <div className="console-brand">DonasiTrack</div>
        <p className="console-caption">Satu donasi dari hati</p>
        <nav className="console-menu">
          <Link href="/donatur" className="console-link">
            <span className="console-link-icon">DB</span>
            Dashboard
          </Link>
          <Link href="/tracking" className="console-link">
            <span className="console-link-icon">TR</span>
            Tracking
          </Link>
          <Link href="/donatur/kampanye" className="console-link">
            <span className="console-link-icon">CP</span>
            Kampanye
          </Link>
          <Link href="/donatur/riwayat" className="console-link">
            <span className="console-link-icon">RY</span>
            Riwayat
          </Link>
          <Link href="/donatur/pengaturan" className="console-link active">
            <span className="console-link-icon">PR</span>
            Profil
          </Link>
        </nav>
      </aside>

      <section className="console-main">
        <div className="console-topbar">
          <div>
            <h1>Profil</h1>
            <p>Kelola donasi dan tracking bantuan secara realtime</p>
          </div>
          <div className="console-user-pill">{session.user?.name ?? "Guest"}</div>
        </div>

        {!isReady ? (
          <section className="console-surface">
            <h2>Memuat...</h2>
            <p className="console-muted">Memuat profil Anda...</p>
          </section>
        ) : !session.token || !session.user ? (
          <section className="console-surface">
            <h2>Akses Ditolak</h2>
            <p className="console-muted">{session.message}</p>
            <Link href="/auth" className="console-btn info" style={{ marginTop: 12 }}>
              Login
            </Link>
          </section>
        ) : (
          <section className="console-surface">
            <h2>Informasi Akun</h2>
            <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
              <div>
                <p className="console-label">Nama</p>
                <p style={{ color: "#0f172a", fontWeight: 500, marginTop: 4 }}>{session.user?.name}</p>
              </div>
              <div>
                <p className="console-label">Email</p>
                <p style={{ color: "#0f172a", fontWeight: 500, marginTop: 4 }}>{session.user?.email}</p>
              </div>
              <div>
                <p className="console-label">Role</p>
                <p style={{ color: "#0f172a", fontWeight: 500, marginTop: 4 }}>{session.user?.role}</p>
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
