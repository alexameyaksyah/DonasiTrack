import { AdminConsoleSidebar } from "../../../components/AdminConsoleSidebar";
import { UserManagementPanel } from "../../../components/UserManagementPanel";

export default function AdminUsersPage() {
  return (
    <main className="admin-shell fade-up">
      <AdminConsoleSidebar active="users" />
      <section className="console-main">
        <div className="console-topbar">
          <div>
            <h1>Manajemen Pengguna</h1>
            <p>Blokir sementara akun atau hapus akun yang tidak memiliki relasi data.</p>
          </div>
          <div className="console-user-pill">Admin</div>
        </div>
        <div className="console-surface">
          <UserManagementPanel />
        </div>
      </section>
    </main>
  );
}
