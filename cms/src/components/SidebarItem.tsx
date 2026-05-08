import Link from "next/link";

type SidebarItemProps = {
  href: string;
  icon: string;
  label: string;
  isActive: boolean;
};

export function SidebarItem({ href, icon, label, isActive }: SidebarItemProps) {
  return (
    <Link href={href} className={`console-link ${isActive ? "active" : ""}`}>
      <span className="console-link-icon">{icon}</span>
      {label}
    </Link>
  );
}