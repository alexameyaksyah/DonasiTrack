"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminConsoleSidebar } from "../../../components/AdminConsoleSidebar";
import { AdminOperationalFieldApp } from "../../../components/AdminOperationalFieldApp";
import { useAdminGuard } from "../../../hooks/useAdminGuard";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "DONOR" | "ADMIN";
};

const SESSION_TOKEN_KEY = "donasi-track-session-token";
const SESSION_USER_KEY = "donasi-track-session-user";

function readSession(): { token: string; user: SessionUser | null; message: string } {
  if (typeof window === "undefined") {
    return { token: "", user: null, message: "" };
  }

  const storedToken = localStorage.getItem(SESSION_TOKEN_KEY) || "";
  const storedUser = localStorage.getItem(SESSION_USER_KEY);

  if (!storedToken || !storedUser) {
    return { token: "", user: null, message: "Silakan login untuk mengakses modul relawan." };
  }

  try {
    return { token: storedToken, user: JSON.parse(storedUser) as SessionUser, message: "" };
  } catch {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
    return { token: "", user: null, message: "Sesi tidak valid, silakan login ulang." };
  }
}

export default function AdminRelawanPage() {
  const { ready } = useAdminGuard();
  const [session, setSession] = useState({ token: "", user: null as SessionUser | null, message: "" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      setSession(readSession());
      setMounted(true);
    });
  }, []);

  if (!ready) {
    return (
      <main className="admin-shell fade-up">
        <section className="console-main">
          <section className="console-surface">
            <p className="console-muted">Mengalihkan...</p>
          </section>
        </section>
      </main>
    );
  }

  if (!mounted) {
    return (
      <main className="admin-shell fade-up">
        <section className="console-main">
          <section className="console-surface">
            <p className="console-muted">Memuat relawan...</p>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell fade-up">
      <AdminConsoleSidebar active="relawan" />

      <section className="console-main">
        <div className="console-topbar">
          <div>
            <h1>Relawan Console</h1>
            <p>Manajemen tugas lapangan, scan QR, dan update status distribusi.</p>
          </div>
          <div className="console-user-pill">{session.user?.name ?? "Relawan"}</div>
        </div>

        {!session.token || !session.user ? (
          <section className="console-surface">
            <h2>Akses Relawan</h2>
            <p className="console-muted">{session.message}</p>
            <Link href="/auth" className="console-btn info" style={{ marginTop: 12 }}>
              Login Sekarang
            </Link>
          </section>
        ) : (
          <>
            <section className="console-kpis" style={{ marginBottom: 16 }}>
              <article className="console-surface">
                <p className="console-label">Nama Relawan</p>
                <p className="console-value" style={{ fontSize: "1.4rem" }}>{session.user.name}</p>
                <p className="console-muted">{session.user.email}</p>
              </article>
              <article className="console-surface">
                <p className="console-label">Role Saat Ini</p>
                <p className="console-value" style={{ fontSize: "1.4rem" }}>{session.user.role}</p>
                <p className="console-tag">Mode lapangan aktif</p>
              </article>
              <article className="console-surface">
                <p className="console-label">Status Shift</p>
                <p className="console-value" style={{ fontSize: "1.4rem" }}>On Duty</p>
                <Link href="/tracking/demo" className="console-btn neutral" style={{ marginTop: 10 }}>
                  Lihat Tracking
                </Link>
              </article>
            </section>

            <AdminOperationalFieldApp authToken={session.token} />
          </>
        )}
      </section>
    </main>
  );
}
