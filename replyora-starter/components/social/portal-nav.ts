/**
 * replyora Social portal — navigation model (Entire Socials-style IA).
 * Two levels: the workspace top nav, and the per-client sub-nav.
 * Plain module (no "use client") so client components can import it.
 *
 * Client data is read from the Neon `clients` table (lib/social/clients.ts) —
 * there is no placeholder roster. The current client's real name is provided to
 * client components (breadcrumb, footer) via ClientNameContext, populated by the
 * /clients/[id] layout from getClient().
 */

export interface NavItem {
  label: string;
  href: string;
}

/** Top workspace nav (right-aligned). Logout is rendered separately. */
export const WORKSPACE_NAV: NavItem[] = [
  { label: "Clients", href: "/clients" },
  { label: "To-Do", href: "/tasks" },
  { label: "Assets", href: "/assets" },
  { label: "Invoices", href: "/invoices" },
  { label: "Settings", href: "/settings" },
];

export interface ClientNavItem {
  num: string;
  label: string;
  /** URL segment after /clients/[id]; "" is the Overview root. */
  slug: string;
}

/** Per-client sub-nav — the client is the unit everything hangs off. */
export const CLIENT_NAV: ClientNavItem[] = [
  { num: "01", label: "Overview", slug: "" },
  { num: "02", label: "Grid", slug: "grid" },
  { num: "03", label: "Calendar", slug: "calendar" },
  { num: "04", label: "Studio", slug: "studio" },
  { num: "05", label: "Assets", slug: "assets" },
  { num: "06", label: "Chatbox", slug: "chatbox" },
  { num: "07", label: "Approvals", slug: "approvals" },
  { num: "08", label: "Reports", slug: "reports" },
  { num: "09", label: "Invoices", slug: "invoices" },
  { num: "10", label: "Integrations", slug: "integrations" },
];

/**
 * Neutral fallback name used only when a client row can't be loaded (e.g. a bad
 * id). Real names come from the Neon `clients` table via getClient().
 */
export function clientName(_id: string): string {
  return "Client";
}

/** The current client-nav section label for a pathname ("Overview" default). */
export function sectionLabel(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean); // ["clients","<id>","grid"]
  if (parts[0] === "clients" && parts[1]) {
    return CLIENT_NAV.find((n) => n.slug === (parts[2] ?? ""))?.label ?? "Overview";
  }
  const top = WORKSPACE_NAV.find((n) => n.href === "/" + (parts[0] ?? ""));
  return top?.label ?? "Workspace";
}

/** True when the path is inside a specific client (/clients/[id]/...). */
export function isClientRoute(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  return parts[0] === "clients" && Boolean(parts[1]);
}
