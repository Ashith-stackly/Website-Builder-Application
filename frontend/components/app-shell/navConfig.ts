import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  LayoutTemplate,
  Settings,
  Blocks,
  Newspaper,
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
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Blog", href: "/blog/manage", icon: Newspaper },
  { label: "Templates", href: "/templates", icon: LayoutTemplate },
  { label: "Builder", href: "/builder", icon: Blocks, external: true },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];
 
/** True when `pathname` is under `href` (exact for /dashboard, prefix otherwise). */
export function isActivePath(pathname: string, href: string): boolean {
  // Normalize pathname to handle optional trailing slashes
  const p = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  if (href === "/dashboard") return p === "/dashboard";
  return p === href || p.startsWith(`${href}/`);
}
 
 