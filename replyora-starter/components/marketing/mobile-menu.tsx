"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { NAV_GROUPS, TOP_LINKS } from "@/components/marketing/nav-config";

/**
 * Mobile hamburger + slide-in panel with accordion sections.
 *
 * The panel is portalled to <body>: the site header uses `backdrop-blur`, and a
 * backdrop-filter makes that element the containing block for fixed-position
 * descendants — which clipped this overlay to the header's height. Portalling
 * escapes it so `fixed inset-0` resolves against the viewport.
 */
export function MobileMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-ink"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          />
          <div className="absolute right-0 top-0 flex h-full w-80 max-w-[88%] flex-col bg-cream shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <Logo height={28} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink hover:bg-oat"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {NAV_GROUPS.map((group) => (
                <details
                  key={group.label}
                  className="group border-b border-border/60 py-1"
                >
                  <summary className="flex cursor-pointer items-center justify-between py-2.5 text-sm font-semibold text-ink marker:content-none">
                    {group.label}
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="pb-2">
                    {group.items.map((item) => (
                      <Link
                        key={item.label + item.href}
                        href={item.href}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-oat"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-oxblood/10 text-oxblood">
                          <item.icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-oxblood">
                            {item.label}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </details>
              ))}

              {TOP_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block border-b border-border/60 py-3.5 text-sm font-semibold text-ink hover:text-oxblood"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="space-y-2 border-t border-border p-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/signup">Start free trial</Link>
              </Button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
