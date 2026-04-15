import Link from "next/link";

type AdminMenuKey = "dashboard" | "campaigns" | "verification" | "logistics" | "report" | "profile";

type AdminConsoleSidebarProps = {
  active: AdminMenuKey;
};

const entries: Array<{ key: AdminMenuKey; href: string; label: string; icon: string }> = [
  { key: "dashboard", href: "/admin", label: "Dashboard", icon: "DB" },
  { key: "campaigns", href: "/admin/campaigns", label: "Kampanye", icon: "CP" },
  { key: "verification", href: "/admin/verifikasi", label: "Validasi Donatur", icon: "VD" },
  { key: "logistics", href: "/admin/logistik", label: "Logistik", icon: "LG" },
];

export function AdminConsoleSidebar({ active }: AdminConsoleSidebarProps) {
  return (
    <aside className="console-sidebar">
      <div className="console-brand">DonasiTrack</div>
      <p className="console-caption">Menu Utama</p>
      <nav className="console-menu">
        {entries.map((entry) => (
          <Link key={entry.key} href={entry.href} className={`console-link ${entry.key === active ? "active" : ""}`}>
            <span className="console-link-icon">{entry.icon}</span>
            {entry.label}
          </Link>
        ))}
      </nav>
      <p className="console-caption">Lainnya</p>
      <nav className="console-menu">
        <Link href="/tracking/demo" className={`console-link ${active === "report" ? "active" : ""}`}>
          <span className="console-link-icon">RP</span>
          Laporan
        </Link>
        <Link href="/profil" className={`console-link ${active === "profile" ? "active" : ""}`}>
          <span className="console-link-icon">PR</span>
          Profil
        </Link>
      </nav>
    </aside>
  );
}
