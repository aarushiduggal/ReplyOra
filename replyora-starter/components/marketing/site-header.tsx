"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { MobileMenu } from "@/components/marketing/mobile-menu";
import { TOP_LINKS, type TopLink } from "@/components/marketing/nav-config";
import { cn } from "@/lib/utils";

function NavItem({ link }: { link: TopLink }) {
  const [open, setOpen] = useState(false);

  const triggerClass =
    "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-ink/70 transition-colors hover:bg-oxblood/5 hover:text-oxblood focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  if (!link.children) {
    return (
      <Link href={link.href} className={triggerClass}>
        {link.label}
      </Link>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href={link.href}
        className={triggerClass}
        aria-expanded={open}
        onClick={() => setOpen(false)}
      >
        {link.label}
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </Link>

      {open && (
        <div className="absolute left-0 top-full z-50 pt-3">
          <div className="w-64 rounded-2xl border border-oxblood/10 bg-cream p-2 shadow-xl shadow-oxblood/10">
            {link.children.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-oxblood/5"
              >
                <span className="block text-sm font-medium text-ink group-hover:text-oxblood">
                  {c.label}
                </span>
                {c.desc && (
                  <span className="mt-0.5 block text-xs text-ink/55">{c.desc}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
        <Logo variant="mark" height={scrolled ? 44 : 54} priority className="transition-all" />

        {/* Desktop nav */}
        <nav
          aria-label="Main"
          className="hidden items-center gap-1 md:flex"
        >
          {TOP_LINKS.map((link) => (
            <NavItem key={link.label} link={link} />
          ))}
          <Link
            href="/login"
            className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-ink/70 transition-colors hover:bg-oxblood/5 hover:text-oxblood focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Log in
          </Link>
        </nav>

        <MobileMenu />
      </div>
    </header>
  );
}
