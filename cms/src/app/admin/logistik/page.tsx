import { AdminConsoleSidebar } from "../../../components/AdminConsoleSidebar";
import { LogisticsPanel } from "../../../components/LogisticsPanel";

export default async function AdminLogisticsPage() {
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
