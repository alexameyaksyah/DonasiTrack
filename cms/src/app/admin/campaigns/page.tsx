"use client";

import { AdminConsoleSidebar } from "../../../components/AdminConsoleSidebar";
import { CampaignManagementConsole } from "../../../components/CampaignManagementConsole";
import { useAdminGuard } from "../../../hooks/useAdminGuard";

export default function AdminCampaignsPage() {
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
      <AdminConsoleSidebar active="campaigns" />
      <section className="console-main">
        <div className="console-topbar">
          <div>
            <h1>Manajemen Kampanye</h1>
            <p>Buat kampanye baru dan pantau progres donasi aktif.</p>
          </div>
          <div className="console-user-pill">Admin</div>
        </div>

        <CampaignManagementConsole />
      </section>
    </main>
  );
}
