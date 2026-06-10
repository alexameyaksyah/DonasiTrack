"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

type DonorStats = {
  totalDonationAmount: number;
  activeCampaigns: number;
  peopleHelped: number;
  monthlyIncrease: number;
};

type Donation = {
  id: string;
  campaignId: string;
  amount?: number;
  createdAt: string;
  verificationStatus?: string;
  campaign?: {
    id: string;
    title: string;
    collectedAmount: number;
    targetAmount: number;
  };
};

export default function DonorPage() {
  const [session, setSession] = useState(EMPTY_SESSION);
  const [flashMessage, setFlashMessage] = useState("");
  const [stats, setStats] = useState<DonorStats | null>(null);
  const [isReady, setIsReady] = useState(false);
  const API_URL = "http://localhost:3000/api";

  // Read session from localStorage after mount and mark as ready
  useEffect(() => {
    // Schedule state updates in a microtask to avoid cascade warnings
    Promise.resolve().then(() => {
      const sessionData = readDonorSession();
      setSession(sessionData);
      setIsReady(true);
    });
  }, []);

  // Memoized function to fetch and update stats
  const fetchStats = (token: string) => {
    if (!token) return;
    
    fetch(`${API_URL}/donations/me`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((donations: Donation[]) => {
        // Calculate stats from donations
        const verifiedDonations = donations.filter(
          (d) => d.verificationStatus === "VERIFIED" || d.verificationStatus === "verified"
        );
        
        const totalAmount = verifiedDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
        const uniqueCampaigns = new Set(verifiedDonations.map((d) => d.campaignId)).size;
        
        // Estimate people helped based on verified donations
        const peopleEstimate = verifiedDonations.length;

        setStats({
          totalDonationAmount: totalAmount,
          activeCampaigns: uniqueCampaigns,
          peopleHelped: peopleEstimate,
          monthlyIncrease: 0, // Calculate from last 30 days if needed
        });
      })
      .catch(() => {
        setStats(null);
      });
  };

  useEffect(() => {
    if (!isReady || !session.token) return;

    // Initial fetch
    fetchStats(session.token);

    // Set up auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchStats(session.token);
    }, 5000);

    return () => clearInterval(interval);
  }, [isReady, session.token]);

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
        <p className="console-caption">Satu donasi dari hati</p>
        <nav className="console-menu">
          <Link href="/donatur" className="console-link active">
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
          <Link href="/donatur/pengaturan" className="console-link">
            <span className="console-link-icon">PR</span>
            Profil
          </Link>
        </nav>
      </aside>

      <section className="console-main">
        <div className="console-topbar">
          <div>
            <h1>Selamat datang kembali, {session.user?.name ?? "Guest"} 👋</h1>
            <p>Kelola donasi dan tracking bantuan secara realtime</p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div className="console-user-pill">
              {session.user?.name ?? "Guest"}
            </div>
            <button
              onClick={onLogout}
              className="console-btn danger"
              style={{ marginBottom: 0 }}
            >
              Logout
            </button>
          </div>
        </div>

        {!isReady ? (
          <section className="console-surface">
            <h2>Memuat...</h2>
            <p className="console-muted">Memuat data profil Anda...</p>
          </section>
        ) : !session.token || !session.user ? (
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
                <p className="console-label">Total Donasi</p>
                <p className="console-value" style={{ fontSize: "1.8rem" }}>
                  Rp {(stats?.totalDonationAmount || 0).toLocaleString("id-ID")}
                </p>
                <p className="console-tag" style={{ color: "#10b981" }}>
                  ↑ {stats?.monthlyIncrease || 0}% bulan ini
                </p>
              </article>
              <article className="console-surface">
                <p className="console-label">Kampanye Didukung</p>
                <p className="console-value" style={{ fontSize: "1.8rem" }}>
                  {stats?.activeCampaigns || 0}
                </p>
                <p className="console-tag">Aktif</p>
              </article>
              <article className="console-surface">
                <p className="console-label">Orang Terbantu</p>
                <p className="console-value" style={{ fontSize: "1.8rem" }}>
                  {stats?.peopleHelped || 0}
                </p>
                <p className="console-tag">Melalui donasimu</p>
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
