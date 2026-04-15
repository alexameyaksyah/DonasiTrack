import { AdminNav } from "../../../components/AdminNav";
import { VerificationPanel } from "../../../components/VerificationPanel";

export default function AdminVerificationPage() {
  return (
    <main className="container section fade-up">
      <div className="header-stack">
        <p className="badge">Verification Center</p>
        <h1>Sistem Verifikasi Donasi</h1>
      </div>
      <AdminNav />
      <VerificationPanel />
    </main>
  );
}
