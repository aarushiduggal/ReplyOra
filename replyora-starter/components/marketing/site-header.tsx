"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "@/components/marketing/mobile-menu";
import { TOP_LINKS } from "@/components/marketing/nav-config";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-cream/85 backdrop-blur transition-all duration-200",
        scrolled ? "border-border shadow-sm" : "border-transparent",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between px-6 transition-all duration-200",
          scrolled ? "h-14" : "h-20",
        )}
      >
        <Logo height={scrolled ? 28 : 32} priority className="transition-all" />

        {/* Desktop nav */}
        <nav
          aria-label="Main"
          className="hidden items-center gap-1 md:flex"
        >
          {TOP_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-ink/70 transition-colors hover:text-oxblood focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </Link>
          ))}
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
        </nav>

        <MobileMenu />
      </div>
    </header>
  );
}
