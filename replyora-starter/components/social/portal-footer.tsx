"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Wordmark } from "@/components/brand/wordmark";
import { isClientRoute, sectionLabel } from "@/components/social/portal-nav";
import { useClientName } from "@/components/social/client-name-context";
import { GuideFooterLink } from "@/components/social/guide";

/** Portal footer: wordmark left, legal links centre, "( CLIENT / SECTION )" right. */
export function PortalFooter() {
  const pathname = usePathname();
  const clientNameFromCtx = useClientName();
  const section = sectionLabel(pathname).toUpperCase();
  const tag = isClientRoute(pathname)
    ? `${(clientNameFromCtx ?? "CLIENT").toUpperCase()} / ${section}`
    : section;

  return (
    <footer className="border-t border-ink/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
        <Wordmark href="/clients" className="text-base" />

        <nav className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/80">
          <Link href="/terms" className="transition-colors hover:text-oxblood">
            Terms of Service
          </Link>
          <span className="text-ink/35">·</span>
          <Link href="/privacy" className="transition-colors hover:text-oxblood">
            Privacy Policy
          </Link>
          <span className="text-ink/35">·</span>
          <GuideFooterLink className="uppercase tracking-[0.16em] transition-colors hover:text-oxblood" />
        </nav>

        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/80">
          ( {tag} )
        </span>
      </div>
    </footer>
  );
}
