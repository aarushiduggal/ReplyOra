import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

import { WaitlistForm } from "@/components/marketing/beta/waitlist-form";

export const metadata: Metadata = {
  title: "Join the waitlist",
  description:
    "Replyora is in closed beta with a small group of agencies and social media managers. Ask for an invite.",
};

const PROMISES = [
  "Free for your first 30 days — no card, nothing to cancel.",
  "You get the whole product, not a cut-down demo.",
  "We actually want the criticism. That's the point of the beta.",
];

export default function WaitlistPage() {
  return (
    <div className="bg-cream">
      <div className="mx-auto max-w-2xl px-6 py-20 sm:py-28">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-roseink">
          Closed beta
        </p>
        <h1 className="mt-4 font-display text-4xl leading-[1.05] text-wine sm:text-5xl">
          We&apos;re letting in 50 people first.
        </h1>
        <p className="mt-5 text-[15px] leading-relaxed text-ink/75">
          Replyora is open to a small group of agencies and social media
          managers for one month. They get the full product free, and in return
          they tell us what&apos;s wrong with it. If that sounds like you, put
          your name down.
        </p>

        <ul className="mt-8 space-y-3">
          {PROMISES.map((p) => (
            <li key={p} className="flex gap-3 text-[14px] leading-relaxed text-ink/80">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-porcelain"
                aria-hidden="true"
              >
                <Check className="h-3 w-3" />
              </span>
              {p}
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-2xl border border-ink/10 bg-white p-6 sm:p-8">
          <WaitlistForm />
        </div>

        <p className="mt-8 text-[13px] text-ink/65">
          Already have an invite link? Open it to get started — or{" "}
          <Link href="/login" className="font-semibold text-ink underline underline-offset-4">
            log in
          </Link>{" "}
          if you&apos;ve already set up your account.
        </p>
      </div>
    </div>
  );
}
