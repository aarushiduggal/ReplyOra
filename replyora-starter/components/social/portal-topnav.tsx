"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Search } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { WORKSPACE_NAV } from "@/components/social/portal-nav";
import { cn } from "@/lib/utils";

/** Workspace top nav: circular logo left, uppercase links right, active underlined. */
export function PortalTopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-oxblood/10 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <span className="shrink-0">
          <Logo variant="wordmark" href="/clients" height={22} priority />
        </span>

        {/*
          The nav is its own horizontal scroller. Without this the links pushed
          the header to 626px on a 375px screen, so every signed-in page scrolled
          sideways and the wordmark collided with the first link. Scrolling the
          nav (not the page) keeps the desktop layout byte-identical.
        */}
        <nav className="flex min-w-0 flex-1 items-center justify-start gap-4 overflow-x-auto whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.2em] [-ms-overflow-style:none] [scrollbar-width:none] sm:justify-end sm:gap-6 [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new Event("replyora:command"))
            }
            className="hidden items-center gap-1.5 rounded-full border border-oxblood/20 px-2.5 py-1 text-[10px] tracking-[0.12em] text-ink/70 transition-colors hover:border-oxblood/40 hover:text-oxblood sm:inline-flex"
            aria-label="Search — Command K"
          >
            <Search className="h-3 w-3" /> ⌘K
          </button>
          {WORKSPACE_NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 pb-1 transition-colors hover:font-bold",
                  active
                    ? "text-oxblood underline decoration-oxblood underline-offset-[7px]"
                    : "text-ink/85 hover:text-oxblood",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => void signOut({ redirectTo: "/login" })}
            className="shrink-0 pb-1 uppercase tracking-[0.2em] text-ink/85 transition-colors hover:font-bold hover:text-oxblood"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
