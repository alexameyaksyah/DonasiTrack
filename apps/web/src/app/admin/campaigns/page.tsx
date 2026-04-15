import { AdminConsoleSidebar } from "../../../components/AdminConsoleSidebar";
import { CampaignManagementConsole } from "../../../components/CampaignManagementConsole";

export default async function AdminCampaignsPage() {
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
