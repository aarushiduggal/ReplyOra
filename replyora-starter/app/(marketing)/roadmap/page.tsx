import Link from "next/link";
import { Phone, CalendarClock, Languages, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/motion";
import { NotifyForm } from "@/components/marketing/notify-form";

export const metadata = {
  title: "Roadmap",
  description:
    "What's coming next for Replyora — including AI voice & phone answering, so your assistant can handle calls as well as website chat. Join the waitlist.",
};

const EXPLORING = [
  {
    icon: CalendarClock,
    title: "Deeper booking integrations",
    body: "Connect the booking tools clinics and salons already run on, so times are always live.",
  },
  {
    icon: Languages,
    title: "Multilingual replies",
    body: "Answer and book in the language your customer opens the chat in.",
  },
];

export default function RoadmapPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Reveal>
        <p className="text-sm font-semibold uppercase tracking-widest text-rose">
          Roadmap
        </p>
        <h1 className="mt-3 font-display text-4xl text-oxblood">
          What&apos;s coming next
        </h1>
        <p className="mt-4 leading-relaxed text-ink/80">
          Replyora is early, and we build in the open. Today it&apos;s a
          website assistant that replies, captures leads, and books customers.
          Here&apos;s what we&apos;re working toward — none of it is live yet.
        </p>
      </Reveal>

      {/* Headline: voice */}
      <section className="mt-10 rounded-2xl border border-oxblood/20 bg-card p-7 shadow-sm ring-1 ring-oxblood/10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-oxblood/10 text-oxblood">
            <Phone className="h-5 w-5" />
          </div>
          <span className="rounded-full bg-oat px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-ink/60">
            Coming soon · Pro
          </span>
        </div>
        <h2 className="mt-4 font-display text-2xl text-ink">
          AI voice &amp; phone answering
        </h2>
        <p className="mt-2 leading-relaxed text-ink/80">
          The same assistant that handles your website chat, now on the phone —
          answering and booking calls 24/7 in your brand voice, so missed and
          after-hours calls become booked jobs instead of voicemails. It&apos;s
          not available yet; we&apos;re building it as a Pro capability and
          gauging interest first.
        </p>
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-ink">
            Want it? Get notified the moment it&apos;s live.
          </p>
          <NotifyForm feature="voice" source="roadmap" />
        </div>
      </section>

      {/* Also exploring */}
      <section className="mt-12">
        <h2 className="flex items-center gap-2 font-display text-2xl text-oxblood">
          <Sparkles className="h-5 w-5" /> Also exploring
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {EXPLORING.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-oxblood/10 text-oxblood">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold text-ink">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-ink/60">
          These are directions we&apos;re investigating, not commitments or
          release dates.
        </p>
      </section>

      {/* CTA */}
      <div className="mt-12 rounded-2xl bg-oxblood p-8 text-cream">
        <h2 className="font-display text-2xl">
          Meanwhile, the website assistant is ready today
        </h2>
        <p className="mt-2 text-cream/80">
          Start a 7-day trial and let Replyora answer, qualify, and book from
          your website while we build what&apos;s next.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild className="bg-cream text-oxblood hover:bg-cream/90">
            <Link href="/signup">Start 7-day trial</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-cream/40 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
          >
            <Link href="/demo">Book a demo</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
