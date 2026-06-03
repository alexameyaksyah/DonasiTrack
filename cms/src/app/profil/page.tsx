"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminConsoleSidebar } from "../../components/AdminConsoleSidebar";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "DONOR" | "ADMIN";
};

const SESSION_TOKEN_KEY = "donasi-track-session-token";
const SESSION_USER_KEY = "donasi-track-session-user";

function readProfileSession(): { token: string; user: SessionUser | null; message: string } {
  if (typeof window === "undefined") {
    return { token: "", user: null, message: "" };
  }

  const token = localStorage.getItem(SESSION_TOKEN_KEY) || "";
  const userRaw = localStorage.getItem(SESSION_USER_KEY);

  if (!token || !userRaw) {
    return { token: "", user: null, message: "Sesi tidak ditemukan. Silakan login kembali." };
  }

  try {
    return { token, user: JSON.parse(userRaw) as SessionUser, message: "" };
  } catch {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
    return { token: "", user: null, message: "Sesi tidak valid. Silakan login ulang." };
  }
}

const EMPTY_SESSION: { token: string; user: SessionUser | null; message: string } = {
  token: "",
  user: null,
  message: "",
};

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState(() => readProfileSession());
  const [flashMessage, setFlashMessage] = useState("");

  useEffect(() => {
    if (session.user?.role === "DONOR") {
      router.replace("/donatur");
    }
  }, [router, session.user?.role]);


  let initials = "PR";
  if (session.user?.name) {
    const parts = session.user.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      initials = parts[0].slice(0, 2).toUpperCase();
    } else if (parts.length > 1) {
      initials = `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
  }

  function logout() {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
    setSession(EMPTY_SESSION);
    setFlashMessage("Anda telah logout.");
  }

  if (session.user?.role === "DONOR") {
    return (
      <main className="admin-shell fade-up">
        <section className="console-main">
          <section className="console-surface">
            <h2>Akses Terbatas</h2>
            <p className="console-muted">Mengalihkan ke dashboard donatur...</p>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell fade-up">
      <AdminConsoleSidebar active="profile" />

      <section className="console-main">
        <div className="console-topbar">
          <div>
            <h1>Profil</h1>
            <p>Kelola informasi akun dan akses sesi aktif.</p>
          </div>
          <div className="console-user-pill">{session.user?.role ?? "Guest"}</div>
        </div>

        {!session.user ? (
          <section className="console-surface">
            <h2>Akun Tidak Ditemukan</h2>
            <p className="console-muted">{session.message || flashMessage}</p>
            <Link href="/auth" className="console-btn info" style={{ marginTop: 10 }}>
              Login Sekarang
            </Link>
          </section>
        ) : (
          <section className="console-grid-two" style={{ gridTemplateColumns: "300px 1fr" }}>
            <article className="console-surface">
              <div className="verification-avatar" style={{ width: 64, height: 64, fontSize: "1.2rem" }}>
                {initials}
              </div>
              <h3 style={{ marginTop: 12 }}>{session.user.name}</h3>
              <p className="console-muted">{session.user.email}</p>
              <span className="console-tag" style={{ marginTop: 10 }}>{session.user.role}</span>
              <button className="console-btn danger" style={{ marginTop: 14 }} onClick={logout}>
                Logout
              </button>
            </article>

            <article className="console-surface">
              <h2>Informasi Akun</h2>
              <ul className="timeline">
                <li>
                  <strong>Nama</strong>
                  <div className="console-muted">{session.user.name}</div>
                </li>
                <li>
                  <strong>Email</strong>
                  <div className="console-muted">{session.user.email}</div>
                </li>
                <li>
                  <strong>Role</strong>
                  <div className="console-muted">{session.user.role}</div>
                </li>
              </ul>
            </article>
          </section>
        )}
      </section>
    </main>
  );
}
