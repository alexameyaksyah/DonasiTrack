"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { rupiah } from "../../../lib/format";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "DONOR" | "ADMIN";
};

type Donation = {
  id: string;
  amount?: number;
  type: string;
  createdAt: string;
  verificationStatus?: string;
  paymentStatus?: string;
  itemName?: string;
  quantity?: number;
  campaign?: {
    id: string;
    title: string;
  };
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

export default function DonorRiwayatPage() {
  const [session, setSession] = useState(EMPTY_SESSION);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const API_URL = "http://localhost:3000/api";

  // Read session from localStorage after mount
  useEffect(() => {
    Promise.resolve().then(() => {
      const sessionData = readDonorSession();
      setSession(sessionData);
      setIsReady(true);
    });
  }, []);

  useEffect(() => {
    if (!isReady || !session.token) return;

    setIsLoading(true);
    fetch(`${API_URL}/donations/me`, {
      headers: {
        "Authorization": `Bearer ${session.token}`,
      },
    })
      .then((res) => res.json())
      .then((data: Donation[]) => {
        setDonations(data);
      })
      .catch(() => {
        setDonations([]);
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
          <Link href="/donatur/kampanye" className="console-link">
            <span className="console-link-icon">CP</span>
            Kampanye
          </Link>
          <Link href="/donatur/riwayat" className="console-link active">
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
            <h1>Riwayat Donasi</h1>
            <p>Kelola donasi dan tracking bantuan secara realtime</p>
          </div>
          <div className="console-user-pill">{session.user?.name ?? "Guest"}</div>
        </div>

        {!isReady ? (
          <section className="console-surface">
            <h2>Memuat...</h2>
            <p className="console-muted">Memuat data riwayat Anda...</p>
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
            <h2>Riwayat Donasi</h2>
            {isLoading ? (
              <p className="console-muted">Memuat riwayat donasi Anda...</p>
            ) : donations.length === 0 ? (
              <p className="console-muted">Belum ada riwayat donasi</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid rgba(255, 255, 255, 0.1)" }}>
                      <th style={{ textAlign: "left", padding: "12px 8px", color: "#d1d5db" }}>Kampanye</th>
                      <th style={{ textAlign: "left", padding: "12px 8px", color: "#d1d5db" }}>Jumlah</th>
                      <th style={{ textAlign: "left", padding: "12px 8px", color: "#d1d5db" }}>Tanggal</th>
                      <th style={{ textAlign: "left", padding: "12px 8px", color: "#d1d5db" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map((donation) => (
                      <tr key={donation.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                        <td style={{ padding: "12px 8px", color: "#e5e7eb" }}>
                          {donation.campaign?.title || "Kampanye Penggalangan"}
                        </td>
                        <td style={{ padding: "12px 8px", color: "#e5e7eb" }}>
                          {donation.amount ? rupiah(donation.amount) : "-"}
                        </td>
                        <td style={{ padding: "12px 8px", color: "#9ca3af", fontSize: "14px" }}>
                          {new Date(donation.createdAt).toLocaleDateString("id-ID", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td style={{ padding: "12px 8px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 12px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: 600,
                              backgroundColor:
                                donation.verificationStatus === "VERIFIED" || donation.verificationStatus === "verified"
                                  ? "rgba(34, 197, 94, 0.2)"
                                  : "rgba(107, 114, 128, 0.2)",
                              color:
                                donation.verificationStatus === "VERIFIED" || donation.verificationStatus === "verified"
                                  ? "#86efac"
                                  : "#d1d5db",
                            }}
                          >
                            {donation.verificationStatus === "VERIFIED" || donation.verificationStatus === "verified"
                              ? "Terverifikasi"
                              : "Menunggu"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
}
