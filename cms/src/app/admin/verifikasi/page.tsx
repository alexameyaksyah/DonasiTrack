import { AdminConsoleSidebar } from "../../../components/AdminConsoleSidebar";
import { VerificationPanel } from "../../../components/VerificationPanel";

export default function AdminVerificationPage() {
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
