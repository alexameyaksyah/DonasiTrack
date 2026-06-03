export type AdminMenuKey =
  "dashboard" |
  "campaigns" |
  "verification" |
  "logistics" |
  "users" |
  "relawan" |
  "profile" |
  "tracking";

export type AdminConsoleSidebarProps = {
  active: AdminMenuKey;
};