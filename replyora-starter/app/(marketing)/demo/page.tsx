import { CalendarCheck, Mail } from "lucide-react";

import { CONTACT_EMAIL } from "@/lib/site";
import { Reveal } from "@/components/marketing/motion";
import { CalendlyEmbed } from "@/components/marketing/calendly-embed";

const BENEFITS = [
  "A 20-minute walkthrough tailored to your business",
  "See the grid planner, calendar and AI captions live",
  "Leave with a content plan for your first week.",
];

const CALENDLY_URL =
  process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com/hello-replyora/30min";

export default function DemoPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="grid gap-10 md:grid-cols-2">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest text-rose">
            Book a demo
          </p>
          <h1 className="mt-3 font-display text-4xl text-oxblood">
            See Replyora in action
          </h1>
          <p className="mt-4 text-muted-foreground">
            Pick a time and we&apos;ll walk you through the platform — planning,
            creating and scheduling your Instagram &amp; TikTok, plus the website
            chatbox — tailored to your business.
          </p>
          <ul className="mt-6 space-y-3">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-ink/80">
                <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-rose" />
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">
            Prefer email?{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-oxblood hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </Reveal>

        <Reveal>
          {CALENDLY_URL ? (
            <CalendlyEmbed url={CALENDLY_URL} />
          ) : (
            <div className="flex min-h-[700px] flex-col items-center justify-center gap-4 rounded-2xl border border-oxblood/15 bg-cream p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-oxblood text-cream">
                <Mail className="h-6 w-6" />
              </div>
              <h2 className="font-display text-xl text-oxblood">Book by email</h2>
              <p className="text-sm text-muted-foreground">
                Send us a note and we&apos;ll find a time that suits you.
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-sm font-medium text-oxblood hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          )}
        </Reveal>
      </div>
    </div>
  );
}
