"use client";

import { AdminConsoleSidebar } from "../../../components/AdminConsoleSidebar";
import { LogisticsPanel } from "../../../components/LogisticsPanel";
import { useAdminGuard } from "../../../hooks/useAdminGuard";

export default function AdminLogisticsPage() {
  const { ready } = useAdminGuard();

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

  return (
    <main className="admin-shell fade-up">
      <AdminConsoleSidebar active="logistics" />
      <section className="console-main">
        <div className="console-topbar">
          <div>
            <h1>Manajemen Logistik</h1>
            <p>Atur alokasi gudang dan koordinasi distribusi bantuan.</p>
          </div>
          <div className="console-user-pill">Admin</div>
        </div>
        <LogisticsPanel />
      </section>
    </main>
  );
}
