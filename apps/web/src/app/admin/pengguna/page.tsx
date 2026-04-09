import { AdminNav } from "../../../components/AdminNav";
import { UserRolePanel } from "../../../components/UserRolePanel";

export default function AdminUserManagementPage() {
  return (
    <main className="container section">
      <h1 style={{ fontFamily: "var(--font-heading)", marginBottom: 10 }}>Manajemen Pengguna</h1>
      <AdminNav />
      <UserRolePanel />
    </main>
  );
}
