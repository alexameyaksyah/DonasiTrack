"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DonationChart } from "../../components/DonationChart";
import { AdminConsoleSidebar } from "../../components/AdminConsoleSidebar";
import { API_URL, authHeaders } from "../../lib/api";
import { rupiah } from "../../lib/format";

type DashboardStats = {
  totalDonationVerified: number;
  totalDistributedAmount: number;
  totalDistributedItems: number;
  totalInventoryItems: number;
  pendingVerifications: number;
  donationStatusCounts: {
    verified: number;
    pending: number;
    rejected: number;
    total: number;
  };
  donationStatusPercentages: {
    verified: number;
    pending: number;
    rejected: number;
  };
  latestDonations: Array<{
    id: string;
    donorName: string;
    campaignTitle: string;
    verificationStatus: "VERIFIED" | "PENDING" | "REJECTED";
    amount: number;
    itemName: string | null;
    quantity: number | null;
    createdAt: string;
  }>;
  campaigns: Array<{
    id: string;
    title: string;
    collectedAmount: number;
    distributedAmount: number;
    status: "PENDING" | "ACTIVE" | "INACTIVE";
  }>;
};

const SESSION_TOKEN_KEY = "donasi-track-session-token";
const SESSION_USER_KEY = "donasi-track-session-user";

function donationAmountLabel(item: DashboardStats["latestDonations"][number]) {
  if (item.amount > 0) {
    return `+${rupiah(item.amount)}`;
  }

  if (item.itemName && item.quantity) {
    return `+${item.quantity} ${item.itemName}`;
  }

  return "Donasi";
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    [],
  );

  const activeCampaigns =
    stats?.campaigns.filter((campaign) => campaign.status === "ACTIVE")
      .length ?? 0;

  const loadStats = useCallback(async () => {
    const token = localStorage.getItem(SESSION_TOKEN_KEY) || "";
    if (!token) {
      setError("Sesi admin tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      router.push("/auth");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/stats/dashboard`, {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(token),
        },
        cache: "no-store",
      });

      const payload = (await response.json()) as DashboardStats | { message?: string };
      if (!response.ok) {
        const authError = response.status === 401 || response.status === 403;
        const message = "message" in payload ? payload.message || "Gagal memuat statistik" : "Gagal memuat statistik";

        if (authError) {
          localStorage.removeItem(SESSION_TOKEN_KEY);
          localStorage.removeItem(SESSION_USER_KEY);
          router.push("/auth");
        }

        setError(message);
        setLoading(false);
        return;
      }

      setStats(payload as DashboardStats);
      setError("");
    } catch {
      setError("Gagal terhubung ke server API");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadStats();
    }, 5000);

    return () => window.clearInterval(timer);
  }, [loadStats]);

  const verifiedPct = stats?.donationStatusPercentages.verified ?? 0;
  const pendingPct = stats?.donationStatusPercentages.pending ?? 0;
  const rejectedPct = stats?.donationStatusPercentages.rejected ?? 0;

  return (
    <main className="admin-shell fade-up">
      <AdminConsoleSidebar active="dashboard" />

      <section className="console-main">
        <div className="console-topbar">
          <div>
            <h1>Dashboard</h1>
            <p>{dateLabel}</p>
          </div>
          <div className="console-user-pill">Admin</div>
        </div>

        {error ? <div className="console-surface">{error}</div> : null}

        <section className="console-kpis">
          <article className="console-surface">
            <p className="console-label">Total Donasi Masuk</p>
            <p className="console-value">{stats ? rupiah(stats.totalDonationVerified) : loading ? "Memuat..." : "-"}</p>
            <p className="console-tag">{stats?.donationStatusCounts.total ?? 0} donasi tercatat</p>
          </article>
          <article className="console-surface">
            <p className="console-label">Dana Tersalurkan</p>
            <p className="console-value">{stats ? rupiah(stats.totalDistributedAmount) : loading ? "Memuat..." : "-"}</p>
            <p className="console-tag">{stats?.totalDistributedItems ?? 0} item delivered</p>
          </article>
          <article className="console-surface">
            <p className="console-label">Kampanye Aktif</p>
            <p className="console-value">{activeCampaigns}</p>
            <p className="console-tag warn">{stats?.pendingVerifications ?? 0} menunggu verifikasi</p>
          </article>
        </section>

        <section className="console-grid-two">
          <article className="console-surface">
            <h2>Dana Masuk vs Keluar</h2>
            <DonationChart data={stats?.campaigns ?? []} />
          </article>

          <article className="console-surface">
            <h2>Status Donasi</h2>
            <div className="console-progress-row">
              <span>Terverifikasi</span>
              <span>{verifiedPct}%</span>
            </div>
            <div className="console-progress-bar">
              <span style={{ width: `${verifiedPct}%` }} />
            </div>
            <div className="console-progress-row">
              <span>Menunggu Verifikasi</span>
              <span>{pendingPct}%</span>
            </div>
            <div className="console-progress-bar amber">
              <span style={{ width: `${pendingPct}%` }} />
            </div>
            <div className="console-progress-row">
              <span>Ditolak</span>
              <span>{rejectedPct}%</span>
            </div>
            <div className="console-progress-bar blue">
              <span style={{ width: `${rejectedPct}%` }} />
            </div>
            <hr className="console-divider" />
            <h3>Aktivitas Donasi Terbaru</h3>
            <ul className="console-activity">
              {(stats?.latestDonations ?? []).map((item) => (
                <li key={item.id}>
                  <span>{item.donorName} • {item.campaignTitle}</span>
                  <strong>{donationAmountLabel(item)}</strong>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="console-surface">
          <div className="console-row-between">
            <h2>Kampanye Terkini</h2>
            <Link href="/admin/campaigns" className="console-btn neutral">
              Lihat Semua
            </Link>
          </div>
          <div className="console-table-wrap">
            <table className="console-table">
              <thead>
                <tr>
                  <th>Nama Kampanye</th>
                  <th>Terkumpul</th>
                  <th>Tersalurkan</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.campaigns ?? []).slice(0, 5).map((campaign) => {
                  const progress = campaign.collectedAmount <= 0
                    ? 0
                    : Math.min(100, Math.round((campaign.distributedAmount / campaign.collectedAmount) * 100));

                  return (
                    <tr key={campaign.id}>
                      <td>{campaign.title}</td>
                      <td>{rupiah(campaign.collectedAmount)}</td>
                      <td>{rupiah(campaign.distributedAmount)}</td>
                      <td>
                        <div className="console-inline-progress">
                          <span style={{ width: `${progress}%` }} />
                        </div>
                      </td>
                      <td>
                        <span
                          className={`console-status ${
                            campaign.status === "ACTIVE"
                              ? "ok"
                              : campaign.status === "PENDING"
                                ? "pending"
                                : "closed"
                          }`}
                        >
                          {campaign.status === "ACTIVE"
                            ? "Active"
                            : campaign.status === "PENDING"
                              ? "Pending"
                              : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
