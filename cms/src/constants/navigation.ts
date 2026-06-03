import { AdminMenuKey } from "../types/admin";

export const MAIN_MENU_ENTRIES: Array<{ key: AdminMenuKey; href: string; label: string; icon: string }> = [
  { key: "dashboard", href: "/admin", label: "Dashboard", icon: "DB" },
  { key: "campaigns", href: "/admin/campaigns", label: "Kampanye", icon: "CP" },
  { key: "verification", href: "/admin/verifikasi", label: "Validasi Donatur", icon: "VD" },
  { key: "logistics", href: "/admin/logistik", label: "Logistik", icon: "LG" },
  { key: "relawan", href: "/admin/relawan", label: "Relawan", icon: "RW" },
  { key: "users", href: "/admin/pengguna", label: "Pengguna", icon: "US" },
];