"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_URL, authHeaders } from "../../../../lib/api";
import { rupiah } from "../../../../lib/format";
import { DonationForm } from "../../../../components/DonationForm";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "DONOR" | "ADMIN";
};

type Campaign = {
  id: string;
  title: string;
  description?: string;
  disasterType: string;
  location: string;
  targetAmount: number;
  collectedAmount: number;
  status: "PENDING" | "ACTIVE" | "INACTIVE";
  photoUrl?: string;
  createdAt?: string;
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

const EMPTY_SESSION: { token: string; user: AuthUser | null; message: string } = {
  token: "",
  user: null,
  message: "",
};

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params?.id as string | undefined;
  
  const [session, setSession] = useState(EMPTY_SESSION);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDonationForm, setShowDonationForm] = useState(false);
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
    if (!isReady || !session.token || !campaignId) {
      return;
    }

    console.log("Fetching campaign:", campaignId, "with token:", session.token?.substring(0, 20) + "...");
    fetch(`${API_URL}/campaigns/${campaignId}`, {
      headers: authHeaders(session.token),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data: Campaign) => {
        console.log("Campaign fetched successfully:", data);
        setCampaign(data);
      })
      .catch((err) => {
        console.error("Fetch campaign error:", err);
        setCampaign(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isReady, session.token, campaignId]);

  if (!session.token || !session.user) {
    return (
      <main className="admin-shell fade-up">
        <aside className="console-sidebar">
          <div className="console-brand">DonasiTrack</div>
          <p className="console-caption">Satu donasi dari hati</p>
        </aside>
        <section className="console-main">
          <div className="console-surface">
            <h2>Akses Ditolak</h2>
            <p className="console-muted">{session.message}</p>
            <Link href="/auth" className="console-btn info" style={{ marginTop: 12 }}>
              Login
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="admin-shell fade-up">
        <aside className="console-sidebar">
          <div className="console-brand">DonasiTrack</div>
          <p className="console-caption">Satu donasi dari hati</p>
        </aside>
        <section className="console-main">
          <div className="console-surface">
            <h2>Memuat...</h2>
            <p className="console-muted">Memuat detail kampanye...</p>
          </div>
        </section>
      </main>
    );
  }

  if (!campaign) {
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
            <Link href="/donatur/kampanye" className="console-link">
              <span className="console-link-icon">CP</span>
              Kampanye
            </Link>
          </nav>
        </aside>
        <section className="console-main">
          <div className="console-surface">
            <h2>Kampanye Tidak Ditemukan</h2>
            <p className="console-muted">Kampanye yang Anda cari tidak ditemukan.</p>
            <Link href="/donatur/kampanye" className="console-btn info" style={{ marginTop: 12 }}>
              Kembali ke Daftar Kampanye
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const pct = campaign.targetAmount
    ? Math.min(100, Math.round((campaign.collectedAmount / campaign.targetAmount) * 100))
    : 0;
  const img = campaign.photoUrl || `https://picsum.photos/seed/${encodeURIComponent(campaign.id)}/800/450`;

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
          <Link href="/donatur/kampanye" className="console-link active">
            <span className="console-link-icon">CP</span>
            Kampanye
          </Link>
        </nav>
      </aside>

      <section className="console-main">
        <div className="console-topbar">
          <div>
            <h1>{campaign.title}</h1>
            <p>{campaign.disasterType} • {campaign.location}</p>
          </div>
          <div className="console-user-pill">{session.user?.name ?? "Guest"}</div>
        </div>

        <div className="card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={campaign.title} style={{ width: "100%", borderRadius: "12px", marginBottom: 16 }} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: 24 }}>
            <article className="console-surface">
              <p className="console-label">Dana Terkumpul</p>
              <p className="console-value" style={{ fontSize: "1.6rem" }}>
                {rupiah(campaign.collectedAmount)}
              </p>
            </article>
            <article className="console-surface">
              <p className="console-label">Target Dana</p>
              <p className="console-value" style={{ fontSize: "1.6rem" }}>
                {rupiah(campaign.targetAmount)}
              </p>
            </article>
            <article className="console-surface">
              <p className="console-label">Progress</p>
              <p className="console-value" style={{ fontSize: "1.6rem" }}>{pct}%</p>
            </article>
          </div>

          <div className="progress-outer" style={{ height: "12px", marginBottom: 16 }}>
            <div className="progress-inner" style={{ width: `${pct}%` }} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 12, color: "#0f172a" }}>Tentang Kampanye</h3>
            <p style={{ color: "#374151", lineHeight: "1.6" }}>
              {campaign.description ||
                "Kampanye penggalangan dana untuk membantu korban bencana alam. Setiap donasi Anda akan membantu meringankan beban mereka yang terdampak."}
            </p>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              className="donate-now"
              style={{ flex: 1, marginTop: 0 }}
              onClick={() => setShowDonationForm(true)}
            >
              Donasi Sekarang
            </button>
            <Link
              href="/donatur/kampanye"
              className="console-btn neutral"
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              Kembali
            </Link>
          </div>
        </div>
      </section>

      {showDonationForm && campaign && campaignId && (
        <DonationForm
          campaignId={campaignId}
          campaignTitle={campaign.title}
          targetAmount={campaign.targetAmount}
          onClose={() => setShowDonationForm(false)}
          sessionToken={session.token}
        />
      )}
    </main>
  );
}
