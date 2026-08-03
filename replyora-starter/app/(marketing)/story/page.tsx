import Link from "next/link";
import { Instagram, Zap, Sparkles, Building2, HandHeart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/motion";
import { FounderPhoto } from "@/components/marketing/founder-photo";
import { FOUNDER, IG_URL } from "@/lib/site";

export const metadata = {
  title: "Our story",
  description:
    "Why Aarushi is building Replyora, in the open — the lead engine that stops local service businesses losing customers to slow replies.",
};

const FOUNDER_NAME = FOUNDER.name;
const FOUNDER_PHOTO = FOUNDER.photo;

const BELIEFS = [
  {
    icon: Zap,
    title: "Speed is the new service.",
    body: "The business that replies first usually wins the customer — long before price or reviews come into it.",
  },
  {
    icon: Sparkles,
    title: "AI should sound human.",
    body: "A reply should feel like your best team member, not a robot menu.",
  },
  {
    icon: Building2,
    title: "Small businesses deserve enterprise tools.",
    body: "The corner clinic should have the same 24/7 responsiveness as a big chain.",
  },
  {
    icon: HandHeart,
    title: "Done-for-you, not do-it-yourself.",
    body: "You run your business; we set up and train your assistant.",
  },
];

function InstagramLink({ children }: { children: React.ReactNode }) {
  return (
    <a
      href={IG_URL}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-oxblood hover:underline"
    >
      {children}
    </a>
  );
}

export default function StoryPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Reveal>
        <p className="text-sm font-semibold uppercase tracking-widest text-rose">
          Build in public
        </p>
        <h1 className="mt-3 font-display text-4xl text-oxblood">
          Why Replyora exists
        </h1>
      </Reveal>

      <div className="mt-8 space-y-5 leading-relaxed text-ink/80">
        <p>
          Replyora started with a simple, frustrating observation:{" "}
          <strong>good businesses lose customers in unanswered messages.</strong>
        </p>
        <p>
          A salon, a physio clinic, a tradie — someone messages them at 9pm ready
          to book. The message sits unread until the morning. By then the
          customer has booked whoever replied first. The work was there. The
          customer was ready. The only thing missing was a fast reply.
        </p>
        <p>
          Customer conversations shouldn&apos;t stop when a business closes for
          the day. That idea became Replyora — an AI assistant that replies
          instantly, in the business&apos;s own voice, captures the lead,
          qualifies it, and books the customer. 24/7. So no enquiry ever goes cold
          again.
        </p>
      </div>

      {/* About the founder */}
      <section className="mt-14">
        <h2 className="font-display text-2xl text-oxblood">About the founder</h2>
        <div className="mt-6 flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:gap-10">
          {/* Photo + caption */}
          <figure className="shrink-0 text-center">
            <div className="inline-block rounded-2xl bg-oat p-2 shadow-sm ring-1 ring-oxblood/15">
              <FounderPhoto
                src={FOUNDER_PHOTO}
                alt="Aarushi, founder of Replyora"
                initial={FOUNDER_NAME.charAt(0)}
                width={288}
                height={360}
                rounded="rounded-xl"
                objectPosition="center top"
              />
            </div>
            <figcaption className="mt-4">
              <p className="font-display text-lg text-ink">Aarushi</p>
              <p className="text-sm text-muted-foreground">Founder, Replyora</p>
              <p className="mx-auto mt-1.5 max-w-[18rem] text-sm italic text-ink/70">
                &ldquo;Turning missed messages into booked customers.&rdquo;
              </p>
            </figcaption>
          </figure>
          {/* Text */}
          <div className="space-y-4 leading-relaxed text-ink/80">
            <p>
              Hi, I&apos;m <strong>{FOUNDER_NAME}</strong> — the founder of
              Replyora, based in Sydney.
            </p>
            <p>
              Before building Replyora, I worked closely with businesses and
              organisations where I saw first-hand how many opportunities were
              lost simply because enquiries were missed or answered too late. I
              realised that customer conversations shouldn&apos;t stop when a
              business closes for the day. That idea became Replyora — an AI
              customer assistant that works around the clock to answer questions,
              qualify leads and help businesses convert more enquiries into
              customers.
            </p>
            <p>
              I&apos;m building Replyora <strong>in public</strong> — sharing the
              wins, the setbacks, and everything I&apos;m learning as I go. If you
              want to follow the journey, come say hi on Instagram:{" "}
              <InstagramLink>@replyora</InstagramLink>.
            </p>
          </div>
        </div>
      </section>

      {/* What I believe */}
      <section className="mt-14">
        <h2 className="font-display text-2xl text-oxblood">What I believe</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {BELIEFS.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-oxblood/10 text-oxblood">
                <b.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold text-ink">{b.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Where we're headed */}
      <section className="mt-14">
        <h2 className="font-display text-2xl text-oxblood">
          Where we&apos;re headed
        </h2>
        <p className="mt-4 leading-relaxed text-ink/80">
          Replyora is early — and that&apos;s the exciting part. The mission is
          simple: help small and medium service businesses stop losing customers
          to slow replies, and turn every enquiry into a booking.
        </p>
      </section>

      {/* CTA */}
      <div className="mt-12 rounded-2xl bg-oxblood p-8 text-cream">
        <h2 className="font-display text-2xl">
          Want to follow along or work with us?
        </h2>
        <p className="mt-2 text-cream/80">
          Follow{" "}
          <a
            href={IG_URL}
            target="_blank"
            rel="noreferrer"
            className="font-medium underline"
          >
            @replyora
          </a>{" "}
          on Instagram, or book a demo and we&apos;ll build a sample assistant for
          your business.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild className="bg-cream text-oxblood hover:bg-cream/90">
            <Link href="/demo">Book a demo</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-cream/40 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
          >
            <a href={IG_URL} target="_blank" rel="noreferrer">
              <Instagram className="h-4 w-4" />
              Follow on Instagram
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
