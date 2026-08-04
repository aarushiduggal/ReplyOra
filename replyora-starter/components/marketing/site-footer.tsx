import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { CONTACT_EMAIL } from "@/lib/site";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Work", href: "/demo" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Book a demo", href: "/demo" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Security", href: "/security" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div className="space-y-3">
            <Logo height={30} />
            <p className="max-w-xs text-sm text-muted-foreground">
              AI that replies instantly, captures leads, and books customers 24/7.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-block text-sm text-oxblood hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-ink">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-ink/70 hover:text-oxblood"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        <span>© 2026 Replyora · Built burgundy &amp; oat in Sydney.</span>
        <span aria-hidden="true">·</span>
        <Link href="/admin" className="text-ink/50 hover:text-oxblood">
          Staff login
        </Link>
      </div>
    </footer>
  );
}
