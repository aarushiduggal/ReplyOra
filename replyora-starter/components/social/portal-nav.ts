/**
 * replyora Social portal — navigation model (Entire Socials-style IA).
 * Two levels: the workspace top nav, and the per-client sub-nav.
 * Plain module (no "use client") so client components can import it.
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

export interface SampleClient {
  id: string;
  name: string;
  handle: string;
  platforms: string;
}

/**
 * Placeholder roster so the shell is navigable before the Neon client data
 * layer is wired. No city names, per brief. Swap for `clients` table reads next.
 */
export const SAMPLE_CLIENTS: SampleClient[] = [
  { id: "bloom", name: "Bloom Hair Studio", handle: "@bloomhair", platforms: "Instagram · TikTok" },
  { id: "peak", name: "Peak Physio", handle: "@peakphysio", platforms: "Instagram" },
  { id: "corner", name: "The Corner Café", handle: "@thecornercafe", platforms: "Instagram · TikTok" },
];

export function clientName(id: string): string {
  return SAMPLE_CLIENTS.find((c) => c.id === id)?.name ?? "Client";
}

/** The footer's "( CLIENT / SECTION )" tag, derived from the current path. */
export function footerTag(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean); // e.g. ["clients","peak","grid"]
  const clientId = parts[1];
  if (parts[0] === "clients" && clientId) {
    const name = clientName(clientId).toUpperCase();
    const section = (
      CLIENT_NAV.find((n) => n.slug === (parts[2] ?? ""))?.label ?? "Overview"
    ).toUpperCase();
    return `${name} / ${section}`;
  }
  const top = WORKSPACE_NAV.find((n) => n.href === "/" + (parts[0] ?? ""));
  return (top?.label ?? "Workspace").toUpperCase();
}
