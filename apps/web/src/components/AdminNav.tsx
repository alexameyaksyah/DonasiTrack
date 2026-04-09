import Link from "next/link";

export function AdminNav() {
  return (
    <div className="nav-links" style={{ marginBottom: 14 }}>
      <Link href="/admin" className="nav-chip">
        Ringkasan
      </Link>
      <Link href="/admin/campaigns" className="nav-chip">
        Manajemen Kampanye
      </Link>
      <Link href="/admin/verifikasi" className="nav-chip">
        Verifikasi Donasi
      </Link>
      <Link href="/admin/logistik" className="nav-chip">
        Manajemen Logistik
      </Link>
    </div>
  );
}
