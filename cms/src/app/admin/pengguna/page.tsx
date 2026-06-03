"use client";

import { AdminConsoleSidebar } from "../../../components/AdminConsoleSidebar";
import { UserManagementPanel } from "../../../components/UserManagementPanel";
import { useAdminGuard } from "../../../hooks/useAdminGuard";

export default function AdminUsersPage() {
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
