"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { dashboardNav, isNavActive } from "@/components/dashboard/nav-items";
import { HAS_AUTHJS_CLIENT } from "@/lib/data/mode";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const nav = dashboardNav(HAS_AUTHJS_CLIENT);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Logo height={28} href="/dashboard" />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {nav.map((item) => {
          const active = isNavActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-oxblood text-cream"
                  : "text-ink/70 hover:bg-oat hover:text-oxblood",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-border p-3">
        <Link
          href="/"
          className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-ink/70 transition-colors hover:bg-oat hover:text-oxblood"
        >
          View marketing site
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </aside>
  );
}
