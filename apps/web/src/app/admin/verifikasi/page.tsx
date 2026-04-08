import { AdminNav } from "../../../components/AdminNav";
import { VerificationPanel } from "../../../components/VerificationPanel";

export default function AdminVerificationPage() {
  return (
    <main className="container section">
      <h1 style={{ fontFamily: "var(--font-heading)", marginBottom: 10 }}>Sistem Verifikasi Donasi</h1>
      <AdminNav />
      <VerificationPanel />
    </main>
  );
}
