import { DonationChart } from "../../components/DonationChart";
import { AdminConsoleSidebar } from "../../components/AdminConsoleSidebar";
import { getJson } from "../../lib/api";
import { rupiah } from "../../lib/format";
import Link from "next/link";

type DashboardStats = {
  totalDonationVerified: number;
  totalDistributedItems: number;
  totalInventoryItems: number;
  pendingVerifications: number;
  campaigns: Array<{
    id: string;
    title: string;
    collectedAmount: number;
    distributedAmount: number;
    status: "OPEN" | "CLOSED";
  }>;
};

export default async function AdminDashboardPage() {
  let stats: DashboardStats | null = null;
  let error = "";

  try {
    stats = await getJson<DashboardStats>("/stats/dashboard", {
      headers: {
        Authorization: `Bearer ${process.env.ADMIN_DASHBOARD_TOKEN || ""}`,
      },
    });
  } catch (err) {
    error = err instanceof Error ? err.message : "Gagal memuat statistik";
  }

  const dateLabel = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const activeCampaigns = stats?.campaigns.filter((campaign) => campaign.status === "OPEN").length ?? 0;

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
            <p className="console-label">Total Donasi</p>
            <p className="console-value">{stats ? rupiah(stats.totalDonationVerified) : "-"}</p>
            <p className="console-tag">+12.4% bulan ini</p>
          </article>
          <article className="console-surface">
            <p className="console-label">Dana Tersalurkan</p>
            <p className="console-value">{stats ? rupiah(stats.totalDistributedItems) : "-"}</p>
            <p className="console-tag">72% tersalurkan</p>
          </article>
          <article className="console-surface">
            <p className="console-label">Kampanye Aktif</p>
            <p className="console-value">{activeCampaigns}</p>
            <p className="console-tag warn">{stats?.pendingVerifications ?? 0} perlu perhatian</p>
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
              <span>Dana Tersalurkan</span>
              <span>72%</span>
            </div>
            <div className="console-progress-bar">
              <span style={{ width: "72%" }} />
            </div>
            <div className="console-progress-row">
              <span>Menunggu Verifikasi</span>
              <span>18%</span>
            </div>
            <div className="console-progress-bar amber">
              <span style={{ width: "18%" }} />
            </div>
            <div className="console-progress-row">
              <span>Dana Cadangan</span>
              <span>10%</span>
            </div>
            <div className="console-progress-bar blue">
              <span style={{ width: "10%" }} />
            </div>
            <hr className="console-divider" />
            <h3>Aktivitas Terbaru</h3>
            <ul className="console-activity">
              {(stats?.campaigns.slice(0, 3) ?? []).map((campaign) => (
                <li key={campaign.id}>
                  <span>{campaign.title}</span>
                  <strong>+{rupiah(campaign.collectedAmount)}</strong>
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
                        <span className={`console-status ${campaign.status === "OPEN" ? "ok" : "pending"}`}>
                          {campaign.status === "OPEN" ? "Active" : "Pending"}
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
