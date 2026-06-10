import { MAIN_MENU_ENTRIES } from "../constants/navigation";
import { AdminConsoleSidebarProps } from "../types/admin";
import { SidebarItem } from "../components/SidebarItem";

export function AdminConsoleSidebar({ active }: AdminConsoleSidebarProps) {
  return (
    <aside className="console-sidebar">
      <div className="console-brand">DonasiTrack</div>

      <p className="console-caption">Menu Utama</p>
      <nav className="console-menu">
        {MAIN_MENU_ENTRIES.map((entry) => (
          <SidebarItem
            key={entry.key}
            href={entry.href}
            icon={entry.icon}
            label={entry.label}
            isActive={entry.key === active}
          />
        ))}
      </nav>

      <p className="console-caption">Lainnya</p>
      <nav className="console-menu">
        <SidebarItem
          href="/tracking"
          icon="TR"
          label="Lacak Bantuan"
          isActive={active === "tracking"}
        />
        <SidebarItem
          href="/profil"
          icon="PR"
          label="Profil"
          isActive={active === "profile"}
        />
      </nav>
    </aside>
  );
}