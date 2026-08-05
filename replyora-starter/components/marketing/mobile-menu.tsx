"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { TOP_LINKS } from "@/components/marketing/nav-config";

/**
 * Mobile hamburger + slide-in panel.
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
              <Logo variant="mark" height={36} />
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
              {TOP_LINKS.map((link) => (
                <div key={link.label} className="border-b border-border/60 py-3.5">
                  <Link
                    href={link.href}
                    className="block text-sm font-semibold text-ink hover:text-oxblood"
                  >
                    {link.label}
                  </Link>
                  {link.children && (
                    <div className="mt-2 space-y-1 pl-3">
                      {link.children.map((c) => (
                        <Link
                          key={c.href}
                          href={c.href}
                          className="block py-1.5 text-sm text-ink/65 hover:text-oxblood"
                        >
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-border p-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Log in</Link>
              </Button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
