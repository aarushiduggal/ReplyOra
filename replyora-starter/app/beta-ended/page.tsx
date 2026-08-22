import type { Metadata } from "next";
import Link from "next/link";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { betaWindowFor } from "@/lib/beta";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Your beta has ended",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Where an expired beta account lands.
 *
 * Sits OUTSIDE the (social) layout on purpose — that layout is what redirects
 * here, so rendering inside it would loop.
 *
 * Nothing is deleted at the end of a beta. Saying so plainly is the difference
 * between "add a card when you're ready" and "pay now or lose your work".
 */
export default async function BetaEndedPage() {
  // Signed-out visitors were being shown "your beta ended", which is confusing
  // for someone who never had one. Send them to log in.
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");
  const beta = await betaWindowFor(user.email);
  const ended = beta.expiresAt
    ? new Date(beta.expiresAt).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "long",
      })
    : null;

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-lg px-6 py-24 text-center sm:py-32">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-roseink">
          Beta complete
        </p>
        <h1 className="mt-4 font-display text-3xl leading-tight text-wine sm:text-4xl">
          That&apos;s your 30 days.
        </h1>
        <p className="mt-5 text-[15px] leading-relaxed text-ink/75">
          Your free access {ended ? `ended on ${ended}` : "has ended"}. Thank you
          — genuinely — for testing it and telling us what you thought.
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-ink/75">
          Everything you made is still here. Add a card whenever you&apos;re
          ready and you&apos;ll pick up exactly where you left off. If
          Replyora isn&apos;t for you, that&apos;s a completely fine answer —
          nothing happens and nothing gets charged.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button asChild className="rounded-full">
            <Link href="/settings?tab=billing">Choose a plan →</Link>
          </Button>
          <Button asChild variant="link" className="text-ink">
            <Link href="/api/auth/signout">Log out</Link>
          </Button>
        </div>

        <p className="mt-10 text-[13px] leading-relaxed text-ink/60">
          Something not working, or a question about your account? Reply to any
          email we&apos;ve sent you and it comes straight to us.
        </p>
      </div>
    </div>
  );
}
