import type { Metadata } from "next";
import Link from "next/link";
import { Check, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "What's live in Replyora today, and what's coming next. Anything not yet shipped is clearly marked.",
};

/**
 * Public roadmap.
 *
 * CLAUDE.md requires this page to exist so voice/phone answering has somewhere
 * honest to live: it may be shown as "coming soon" on Pro, but must NEVER be
 * described as available today.
 *
 * DELIBERATELY CONSERVATIVE: "Live today" lists only capabilities that exist in
 * the product right now, and "Coming soon" lists only the one item the brief
 * authorises. Adding future promises here is a marketing decision with legal
 * weight — extend it yourself rather than letting it grow by accident.
 */

const LIVE: { title: string; body: string }[] = [
  {
    title: "Plan a month in one sitting",
    body: "Pick your cadence, pillars, tone and length — Studio writes every caption and schedules the whole month onto the calendar.",
  },
  {
    title: "Grid & calendar planning",
    body: "Arrange the feed before it's published, drag tiles to reorder, and see exactly how the month lands.",
  },
  {
    title: "Client approvals",
    body: "Send a tokenised review link. Your client approves or requests changes without needing a login.",
  },
  {
    title: "Publishing to Instagram & Facebook",
    body: "Connect an account once; approved posts go out on schedule.",
  },
  {
    title: "Assets, from anywhere",
    body: "Upload from your desktop, or scan a QR code to send photos straight from a phone. Crop to each platform's shape in Studio.",
  },
  {
    title: "Reports & invoicing",
    body: "Monthly performance for each client, and invoices raised from the same place you do the work.",
  },
  {
    title: "Website chatbox",
    body: "An add-on assistant for your client's own site, answering questions and capturing enquiries.",
  },
];

const SOON: { title: string; body: string; plan: string }[] = [
  {
    title: "Voice & phone answering",
    body: "Let the assistant answer the phone as well as the website — taking enquiries and booking customers when nobody's free to pick up.",
    plan: "Pro",
  },
];

export default function RoadmapPage() {
  return (
    <div className="bg-cream">
      <div className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-roseink">
          Roadmap
        </p>
        <h1 className="mt-4 font-display text-4xl leading-[1.05] text-wine sm:text-5xl">
          What&apos;s live, and what&apos;s next.
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink/75">
          We&apos;d rather be plain about this than oversell it. Everything under
          &ldquo;Live today&rdquo; is in the product right now. Anything still
          being built is marked <strong className="text-ink">Coming soon</strong>{" "}
          — and isn&apos;t included until it ships.
        </p>

        {/* ── Live ─────────────────────────────────────────────────────── */}
        <h2 className="mt-16 font-display text-2xl text-wine">Live today</h2>
        <ul className="mt-6 space-y-5">
          {LIVE.map((f) => (
            <li key={f.title} className="flex gap-4">
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-porcelain"
                aria-hidden="true"
              >
                <Check className="h-3.5 w-3.5" />
              </span>
              <div>
                <h3 className="font-semibold text-ink">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink/75">{f.body}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* ── Coming soon ──────────────────────────────────────────────── */}
        <h2 className="mt-16 font-display text-2xl text-wine">Coming soon</h2>
        <ul className="mt-6 space-y-5">
          {SOON.map((f) => (
            <li
              key={f.title}
              className="flex gap-4 rounded-2xl border border-ink/10 bg-white p-5"
            >
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-oat text-ink"
                aria-hidden="true"
              >
                <Clock className="h-3.5 w-3.5" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-ink">{f.title}</h3>
                  <span className="rounded-full bg-oat px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/80">
                    Coming soon · {f.plan}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-ink/75">{f.body}</p>
                <p className="mt-2 text-[12px] text-ink/60">
                  Not available yet, and not included in any plan until it ships.
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-16 rounded-2xl border border-ink/10 bg-white p-6">
          <h2 className="font-display text-xl text-wine">
            Something missing you need?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/75">
            We build around what our agencies actually ask for. Tell us what
            would make the biggest difference and it goes on the list.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild className="rounded-full">
              <Link href="/demo">Book a demo →</Link>
            </Button>
            <Button asChild variant="link" className="text-ink">
              <Link href="/product">See the product</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
