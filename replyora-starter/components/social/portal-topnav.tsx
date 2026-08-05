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
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Logo variant="mark" href="/clients" height={40} priority />

        <nav className="flex items-center gap-6 text-[11px] font-semibold uppercase tracking-[0.2em]">
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
                  "pb-1 transition-colors",
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
            className="pb-1 uppercase tracking-[0.2em] text-ink/85 transition-colors hover:text-oxblood"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
