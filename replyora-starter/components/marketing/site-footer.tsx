import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { SocialLinks } from "@/components/marketing/social-links";
import { CONTACT_EMAIL } from "@/lib/site";

// Product & Company links live in the header dropdowns now. The footer keeps a
// small Legal list (still being drafted) plus the brand block.
const LEGAL: { label: string; href: string }[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm space-y-3">
            <Logo variant="mark" height={48} />
            <p className="text-sm text-muted-foreground">
              One workspace to plan your content, manage your clients, and never
              miss a conversation.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-block text-sm text-oxblood hover:underline"
            >
              {CONTACT_EMAIL}
            </a>

            <SocialLinks className="pt-1" />
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/40">
              Legal
            </p>
            <ul className="mt-2 space-y-1">
              {LEGAL.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-xs text-ink/45 hover:text-oxblood"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        <span>© 2026 Replyora</span>
        <span aria-hidden="true">·</span>
        <Link href="/admin" className="text-ink/50 hover:text-oxblood">
          Staff login
        </Link>
      </div>
    </footer>
  );
}
