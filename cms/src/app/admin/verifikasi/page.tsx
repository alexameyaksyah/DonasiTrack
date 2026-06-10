"use client";

import { AdminConsoleSidebar } from "../../../components/AdminConsoleSidebar";
import { VerificationPanel } from "../../../components/VerificationPanel";
import { useAdminGuard } from "../../../hooks/useAdminGuard";

export default function AdminVerificationPage() {
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
      <AdminConsoleSidebar active="verification" />
      <section className="console-main">
        <div className="console-topbar">
          <div>
            <h1>Sistem Verifikasi Donasi</h1>
            <p>Validasi bukti donasi secara cepat dan terstruktur.</p>
          </div>
          <div className="console-user-pill">Admin</div>
        </div>
        <div className="console-surface">
          <VerificationPanel />
        </div>
      </section>
    </main>
  );
}
