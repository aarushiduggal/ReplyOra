import {
  BarChart3,
  Blocks,
  BookOpen,
  Bot,
  CalendarCheck,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  MessagesSquare,
  PenLine,
  Settings,
  Star,
  Store,
  RotateCcw,
  Sparkles,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** match only the exact path (used for the overview root) */
  exact?: boolean;
}

/** Single source of truth for dashboard navigation — used by the desktop
 * sidebar and the mobile drawer so they never drift. */
export const DASHBOARD_NAV: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Content Studio", href: "/dashboard/studio", icon: PenLine },
  { label: "Content Calendar", href: "/dashboard/planner", icon: CalendarDays },
  { label: "Business profile", href: "/dashboard/business", icon: Store },
  { label: "Knowledge base", href: "/dashboard/knowledge", icon: BookOpen },
  { label: "Assistant", href: "/dashboard/assistant", icon: Bot },
  {
    label: "Conversations",
    href: "/dashboard/conversations",
    icon: MessagesSquare,
  },
  { label: "Leads", href: "/dashboard/leads", icon: UsersRound },
  { label: "Bookings", href: "/dashboard/bookings", icon: CalendarCheck },
  { label: "Recovery", href: "/dashboard/recovery", icon: RotateCcw },
  { label: "Win-Back Agent", href: "/dashboard/winback", icon: Sparkles },
  { label: "Reviews", href: "/dashboard/reviews", icon: Star },
  { label: "Training", href: "/dashboard/training", icon: GraduationCap },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Install", href: "/dashboard/install", icon: Blocks },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

/** Active-state test shared by both navs. */
export function isNavActive(pathname: string, item: NavItem): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}
