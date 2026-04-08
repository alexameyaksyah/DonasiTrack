import { AdminNav } from "../../components/AdminNav";
import { DonationChart } from "../../components/DonationChart";
import { getJson } from "../../lib/api";
import { rupiah } from "../../lib/format";

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

  return (
    <main className="container section">
      <h1 style={{ fontFamily: "var(--font-heading)", marginBottom: 10 }}>Dashboard Admin (SSR)</h1>
      <p className="muted" style={{ marginBottom: 10 }}>
        Halaman ini dirender di server. Isi token admin melalui env ADMIN_DASHBOARD_TOKEN agar statistik tampil.
      </p>
      <AdminNav />

      {error ? <div className="panel">{error}</div> : null}

      {stats ? (
        <>
          <section className="grid">
            <article className="card">
              <p className="muted">Total Donasi Terverifikasi</p>
              <p className="kpi">{rupiah(stats.totalDonationVerified)}</p>
            </article>
            <article className="card">
              <p className="muted">Barang Tersalurkan</p>
              <p className="kpi">{stats.totalDistributedItems}</p>
            </article>
            <article className="card">
              <p className="muted">Stok Tersedia</p>
              <p className="kpi">{stats.totalInventoryItems}</p>
            </article>
            <article className="card">
              <p className="muted">Pending Verifikasi</p>
              <p className="kpi">{stats.pendingVerifications}</p>
            </article>
          </section>

          <section className="section">
            <div className="card">
              <h2>Donasi Masuk vs Tersalurkan</h2>
              <DonationChart data={stats.campaigns} />
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
