import Link from "next/link";
import { Banknote, Handshake, Megaphone, Repeat } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal, Magnetic } from "@/components/marketing/motion";

export const metadata = {
  title: "Partner & referral program",
  description:
    "Earn recurring commission referring local service businesses to Replyora. Built for agencies, consultants and creators.",
};

const STEPS = [
  {
    icon: Handshake,
    title: "Apply",
    body: "Tell us about your audience — agencies, consultants, bookkeepers and creators welcome.",
  },
  {
    icon: Megaphone,
    title: "Share your link",
    body: "Get a unique referral link and on-brand assets to share with your network.",
  },
  {
    icon: Banknote,
    title: "Earn recurring",
    body: "Earn 20% recurring commission for 12 months on every business you refer.",
  },
];

const TIERS = [
  { name: "Referral", detail: "20% recurring for 12 months", who: "Anyone with an audience" },
  { name: "Agency", detail: "Managed workspaces + volume rates", who: "Agencies running client sites" },
  { name: "Ambassador", detail: "Co-marketing + higher share", who: "Creators & educators" },
];

export default function PartnersPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <Reveal className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-rose/40 bg-oat px-3 py-1 text-xs font-medium uppercase tracking-widest text-wine">
          <Repeat className="h-3.5 w-3.5" />
          Partner program
        </span>
        <h1 className="mt-4 font-display text-4xl text-oxblood">
          Earn recurring commission with Replyora
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          If you work with local service businesses, refer them to Replyora and
          earn on every subscription. It&apos;s a natural fit for agencies,
          consultants and creators.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Magnetic strength={0.35}>
            <Button asChild size="lg">
              <Link href="/demo">Apply to partner</Link>
            </Button>
          </Magnetic>
          <Button asChild size="lg" variant="outline">
            <Link href="/compare">See the product</Link>
          </Button>
        </div>
      </Reveal>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal
            key={s.title}
            delay={i * 0.08}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-oxblood font-display text-lg text-cream">
                {i + 1}
              </span>
              <s.icon className="h-5 w-5 text-rose" />
            </div>
            <h2 className="mt-4 font-semibold text-ink">{s.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
          </Reveal>
        ))}
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {TIERS.map((t, i) => (
          <Reveal
            key={t.name}
            delay={i * 0.08}
            className="rounded-2xl border border-border bg-oat/40 p-6"
          >
            <h3 className="font-display text-xl text-oxblood">{t.name}</h3>
            <p className="mt-2 text-sm font-medium text-ink">{t.detail}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.who}</p>
          </Reveal>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Commission terms are indicative for the prototype and finalised on
        approval.
      </p>
    </div>
  );
}
