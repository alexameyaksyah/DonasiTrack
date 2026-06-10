"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_URL, authHeaders } from "../../../lib/api";
import { rupiah } from "../../../lib/format";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "DONOR" | "ADMIN";
};

type Campaign = {
  id: string;
  title: string;
  disasterType: string;
  location: string;
  targetAmount: number;
  collectedAmount: number;
  status: "PENDING" | "ACTIVE" | "INACTIVE";
  photoUrl?: string;
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

export default function DonorKampanyePage() {
  const [session, setSession] = useState(EMPTY_SESSION);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Read session from localStorage after mount
  useEffect(() => {
    Promise.resolve().then(() => {
      const sessionData = readDonorSession();
      setSession(sessionData);
      setIsReady(true);
    });
  }, []);

  useEffect(() => {
    if (!isReady || !session.token) {
      return;
    }

    setIsLoading(true);
    fetch(`${API_URL}/campaigns`, {
      headers: authHeaders(session.token),
    })
      .then((res) => res.json())
      .then((data: Campaign[]) => {
        const activeOnly = data.filter((campaign) => campaign.status === "ACTIVE");
        setCampaigns(activeOnly);
      })
      .catch((err) => {
        console.error("Fetch campaigns error:", err);
        setCampaigns([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isReady, session.token]);

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
          <Link href="/donatur/kampanye" className="console-link active">
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
            <h1>Daftar Kampanye</h1>
            <p>Kelola donasi dan tracking bantuan secara realtime</p>
          </div>
          <div className="console-user-pill" suppressHydrationWarning>{session.user?.name ?? "Guest"}</div>
        </div>

        {!session.token || !session.user ? (
          <section className="console-surface">
            <h2>Akses Ditolak</h2>
            <p className="console-muted">{session.message}</p>
            <Link href="/auth" className="console-btn info" style={{ marginTop: 12 }}>
              Login
            </Link>
          </section>
        ) : (
          <div className="card">
            <h2>Semua Kampanye</h2>
            {isLoading ? (
              <p className="console-muted">Memuat kampanye...</p>
            ) : campaigns.length === 0 ? (
              <p className="console-muted">Tidak ada kampanye aktif saat ini.</p>
            ) : (
              <div className="grid" style={{ marginTop: 16 }}>
                {campaigns.map((campaign) => {
                  const pct = campaign.targetAmount
                    ? Math.min(100, Math.round((campaign.collectedAmount / campaign.targetAmount) * 100))
                    : 0;
                  const img = campaign.photoUrl || `https://picsum.photos/seed/${encodeURIComponent(campaign.id)}/640/360`;
                  return (
                    <div className="campaign-card-panel" key={campaign.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="campaign-cover" src={img} alt={campaign.title} />
                      <div className="campaign-body card">
                        <h4 style={{ margin: 0 }}>{campaign.title}</h4>
                        <p className="muted" style={{ marginTop: 6 }}>
                          {campaign.disasterType} - {campaign.location}
                        </p>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, alignItems: "center" }}>
                          <small style={{ color: "#7b7b7b" }}>{rupiah(campaign.collectedAmount)}</small>
                          <small className="muted">dari {rupiah(campaign.targetAmount)}</small>
                        </div>
                        <div className="progress-outer">
                          <div className="progress-inner" style={{ width: `${pct}%` }} />
                        </div>
                        <Link href={`/donatur/kampanye/${campaign.id}`} className="donate-now" style={{ textDecoration: "none" }}>
                          Donasi Sekarang
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
