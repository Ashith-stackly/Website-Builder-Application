import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  LayoutTemplate,
  Settings,
  Blocks,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Marks routes that live outside the dashboard shell (full-screen apps). */
  external?: boolean;
}

/** Primary navigation — shared by Sidebar + Command Palette. */
export const primaryNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/dashboard/projects", icon: FolderKanban },
  { label: "Products", href: "/dashboard/products", icon: ShoppingBag },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Templates", href: "/templates", icon: LayoutTemplate },
  { label: "Builder", href: "/builder", icon: Blocks, external: true },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

/** True when `pathname` is under `href` (exact for /dashboard, prefix otherwise). */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
