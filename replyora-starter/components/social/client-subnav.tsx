"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";

import { CLIENT_NAV } from "@/components/social/portal-nav";
import { cn } from "@/lib/utils";

/**
 * Per-client header: breadcrumb ("← Clients / [client] / [Section]") on the
 * left, the 10-item client sub-nav right-aligned, active item underlined.
 */
export function ClientSubNav({
  clientId,
  clientName,
  lockedSlugs = [],
}: {
  clientId: string;
  clientName: string;
  /** Section slugs the plan hasn't unlocked — shown with a lock (gated page). */
  lockedSlugs?: string[];
}) {
  const pathname = usePathname();
  const base = `/clients/${clientId}`;
  const nav = CLIENT_NAV;
  const currentSlug = pathname.startsWith(base + "/")
    ? pathname.slice(base.length + 1).split("/")[0]
    : "";
  const current = CLIENT_NAV.find((n) => n.slug === currentSlug) ?? CLIENT_NAV[0];

  return (
    <div className="border-b border-ink/10">
      <div className="mx-auto max-w-6xl px-6 py-5">
        {/* breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/85">
          <Link href="/clients" className="transition-colors hover:text-oxblood">
            ← Clients
          </Link>
          <span className="text-ink/70">/</span>
          <span className="text-ink">{clientName}</span>
          <span className="text-ink/70">/</span>
          <span className="text-oxblood">{current?.label}</span>
        </div>

        {/* sub-nav */}
        <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
          {nav.map((item) => {
            const href = item.slug ? `${base}/${item.slug}` : base;
            const active = item.slug === (current?.slug ?? "");
            const locked = lockedSlugs.includes(item.slug);
            return (
              <Link
                key={item.slug || "overview"}
                href={href}
                className={cn(
                  "inline-flex items-center gap-1 pb-1 transition-colors hover:font-bold",
                  active
                    ? "text-oxblood underline decoration-oxblood underline-offset-[7px]"
                    : locked
                      ? "text-ink/40 hover:text-oxblood"
                      : "text-ink/85 hover:text-oxblood",
                )}
              >
                {item.label}
                {locked && <Lock className="h-3 w-3" />}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
