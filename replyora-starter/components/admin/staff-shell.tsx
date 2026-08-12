"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert, Eye } from "lucide-react";

import { cn } from "@/lib/utils";

const NAV = [
  { label: "Command center", href: "/admin" },
  { label: "Accounts", href: "/admin/accounts" },
  { label: "Revenue", href: "/admin/billing" },
  { label: "Staff & audit", href: "/admin/staff" },
  { label: "Broadcast", href: "/admin/broadcast" },
];

/**
 * The staff portal chrome — light body with an oxblood header + amber "internal"
 * strip, so it's clearly a distinct staff console (never confused with the
 * client dashboard) without being a heavy all-dark theme.
 */
export function StaffShell({
  staffName,
  staffRole,
  children,
}: {
  staffName: string;
  staffRole: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-stone-100 text-ink">
      {/* Top bar (oxblood, branded, distinct) */}
      <header className="bg-oxblood text-cream">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-cream text-xs font-bold text-oxblood">
              R
            </span>
            <span className="font-semibold tracking-wide">REPLYORA</span>
            <span className="rounded bg-cream px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-oxblood">
              Staff
            </span>
          </div>

          <nav className="flex flex-1 flex-wrap items-center gap-1">
            {NAV.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-cream/20 text-cream"
                      : "text-cream/70 hover:bg-cream/10 hover:text-cream",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 text-sm">
            <span className="text-cream/80">{staffName}</span>
            <span className="rounded-full border border-cream/30 px-2 py-0.5 text-[11px] uppercase tracking-wide text-cream/80">
              {staffRole}
            </span>
            <Link
              href="/clients"
              className="inline-flex items-center gap-1.5 rounded-full border border-cream/40 px-3 py-1 text-cream/90 transition-colors hover:bg-cream/10"
            >
              <Eye className="h-3.5 w-3.5" /> Client view
            </Link>
          </div>
        </div>
      </header>

      {/* Internal notice strip — ink text on a soft sky wash */}
      <div className="flex items-center justify-center gap-2 border-b border-stone/25 bg-sky px-6 py-1.5 text-center text-xs text-ink/80">
        <ShieldAlert className="h-3.5 w-3.5" />
        Internal staff area — you are acting on behalf of clients. Every view and
        edit is audited.
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
