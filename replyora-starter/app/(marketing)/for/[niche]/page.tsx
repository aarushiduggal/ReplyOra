import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, ChevronDown, MessageSquareText } from "lucide-react";

import { NICHE_TEMPLATES } from "@/lib/data/seed";
import { Button } from "@/components/ui/button";
import { Reveal, Magnetic } from "@/components/marketing/motion";
import type { NicheTemplate } from "@/lib/data/types";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://replyora.com";

interface NicheConfig {
  templateId: string;
  headline: string;
  pain: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  faqs: { q: string; a: string }[];
}

// URL slug → template id + tailored SEO content.
const NICHES: Record<string, NicheConfig> = {
  physio: {
    templateId: "physio",
    headline: "Book more initial assessments, answer rebate questions instantly.",
    pain: "Patients enquire after hours and on weekends. If no one replies, they book the next clinic on Google.",
    metaTitle: "AI receptionist for physiotherapy clinics",
    metaDescription:
      "Replyora answers injury and rebate questions and books initial assessments 24/7 for physiotherapy and allied-health clinics. Start a 7-day free trial.",
    keywords: [
      "physio AI receptionist",
      "physiotherapy chatbot",
      "clinic booking assistant",
      "allied health lead capture",
    ],
    faqs: [
      {
        q: "Can the assistant answer health-fund rebate questions?",
        a: "Yes — train it on your rebate and HICAPS details and it explains claiming, EPC/CDM referrals and gap fees, then offers to book an initial assessment.",
      },
      {
        q: "Will it book appointments into my system?",
        a: "It captures the lead and offers a time via the native booking flow, with a Calendly/Google Calendar seam to sync your practice-management software.",
      },
      {
        q: "Do patients need to download anything?",
        a: "No. It's a website widget (plus Instagram/WhatsApp), so patients just chat like they would with your front desk.",
      },
    ],
  },
  salons: {
    templateId: "salon",
    headline: "Fill your chair — capture booking intent the moment it strikes.",
    pain: "Enquiries pile up during appointments. Every unanswered 'how much for balayage?' is a booking lost.",
    metaTitle: "AI booking assistant for salons & beauty",
    metaDescription:
      "Replyora quotes services, answers questions and captures bookings 24/7 for hair, beauty and skin salons — right on your website. 7-day free trial.",
    keywords: [
      "salon booking bot",
      "beauty AI assistant",
      "salon website chat",
      "salon lead capture",
    ],
    faqs: [
      {
        q: "Can it answer from my price list?",
        a: "Yes — paste or upload your service menu and it quotes cuts, colour, balayage and packages, then captures the booking.",
      },
      {
        q: "Where does it run?",
        a: "On your website. Add one line of code and the assistant replies, quotes and captures bookings for every visitor — 24/7.",
      },
      {
        q: "What about deposits and cancellation policies?",
        a: "Train it on your policies and it explains deposits, cancellations and patch-test requirements consistently.",
      },
    ],
  },
  "real-estate": {
    templateId: "real-estate",
    headline: "Qualify buyers and renters, book inspections around the clock.",
    pain: "Buyers browse at 10pm. Slow replies mean they've moved on to another agent by morning.",
    metaTitle: "AI assistant for real estate agencies",
    metaDescription:
      "Replyora qualifies buyers and renters, books inspections and captures appraisal leads 24/7 for real estate agencies. Start a 7-day free trial.",
    keywords: [
      "real estate chatbot",
      "property lead capture",
      "inspection booking assistant",
      "rental application automation",
    ],
    faqs: [
      {
        q: "Can it share inspection times and price guides?",
        a: "Yes — train it on your current listings and it shares open-home times, price guides and suburbs covered, then books the inspection.",
      },
      {
        q: "Does it capture appraisal leads?",
        a: "It qualifies sellers and captures free-appraisal requests with the property details, ready for your agents to follow up.",
      },
      {
        q: "Can it help with rental applications?",
        a: "It walks renters through your application process and requirements and captures their details.",
      },
    ],
  },
  ndis: {
    templateId: "ndis",
    headline: "Explain supports and capture referrals with a caring, clear assistant.",
    pain: "Participants and coordinators have questions about funding and eligibility before they'll enquire.",
    metaTitle: "AI assistant for NDIS providers",
    metaDescription:
      "Replyora explains supports, checks plan-management types and captures referrals 24/7 for NDIS providers, with a caring, clear tone. Start a 7-day free trial.",
    keywords: [
      "NDIS provider chatbot",
      "disability services assistant",
      "NDIS referral capture",
      "support coordination enquiries",
    ],
    faqs: [
      {
        q: "Can it explain how funding works?",
        a: "Yes — train it on your supports and it explains self/plan/NDIA-managed funding, eligibility and service agreements in plain language.",
      },
      {
        q: "Does it handle referrals?",
        a: "It captures participant and coordinator referrals with the details you need, and can flag urgent enquiries.",
      },
      {
        q: "Is it respectful and accessible?",
        a: "The tone is caring and clear, and the widget is built with accessibility in mind (keyboard, contrast, screen-reader friendly).",
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(NICHES).map((niche) => ({ niche }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ niche: string }>;
}) {
  const { niche } = await params;
  const cfg = NICHES[niche];
  if (!cfg) return { title: "Industries" };
  return {
    title: cfg.metaTitle,
    description: cfg.metaDescription,
    keywords: cfg.keywords,
    alternates: { canonical: `${SITE_URL}/for/${niche}` },
    openGraph: {
      title: `${cfg.metaTitle} · Replyora`,
      description: cfg.metaDescription,
      url: `${SITE_URL}/for/${niche}`,
    },
  };
}

export default async function IndustryPage({
  params,
}: {
  params: Promise<{ niche: string }>;
}) {
  const { niche } = await params;
  const cfg = NICHES[niche];
  if (!cfg) notFound();
  const template = NICHE_TEMPLATES.find(
    (t) => t.id === cfg.templateId,
  ) as NicheTemplate;

  // Structured data: FAQPage + Service (LocalBusiness-style) for rich results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: `Replyora for ${template.industry}`,
        serviceType: "AI customer-conversation assistant",
        provider: { "@type": "Organization", name: "Replyora", url: SITE_URL },
        areaServed: "AU",
        description: cfg.metaDescription,
      },
      {
        "@type": "FAQPage",
        mainEntity: cfg.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <Reveal className="mx-auto max-w-4xl px-6 py-20 text-center">
        <span className="text-4xl">{template.emoji}</span>
        <p className="mt-4 text-sm font-semibold uppercase tracking-widest text-rose">
          Replyora for {template.industry}
        </p>
        <h1 className="mt-3 font-display text-5xl leading-tight text-oxblood">
          {cfg.headline}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-ink/80">{cfg.pain}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Magnetic strength={0.35}>
            <Button asChild size="lg">
              <Link href="/signup">
                Start 7-day trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Magnetic>
          <Button asChild size="lg" variant="outline">
            <Link href="/demo">Book a demo</Link>
          </Button>
        </div>
        <p className="mt-4 text-sm text-ink/70">
          No card to start · cancel anytime
        </p>
      </Reveal>

      {/* Questions it handles */}
      <section className="border-y border-border/60 bg-oat/40">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <Reveal>
            <h2 className="text-center font-display text-3xl text-oxblood">
              Questions your assistant handles on day one
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {template.suggestedQuestions.map((q, i) => (
              <Reveal key={q} delay={i * 0.06}>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                  <MessageSquareText className="h-5 w-5 shrink-0 text-rose" />
                  <span className="text-sm text-ink">{q}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* What it knows */}
      <Reveal className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-display text-3xl text-oxblood">
              Pre-trained for {template.industry.toLowerCase()}
            </h2>
            <p className="mt-4 text-ink/70">
              Start from a template that already knows your world — then add your
              own pricing, policies and services in minutes.
            </p>
            <ul className="mt-6 space-y-3">
              {template.knowledge.map((k) => (
                <li key={k.title} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-rose" />
                  <span className="text-sm text-ink/80">
                    <span className="font-medium text-ink">{k.title}:</span>{" "}
                    {k.preview}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-ink/60">
              Assistant persona
            </p>
            <p className="mt-2 font-display text-xl text-oxblood">
              {template.persona.name}
            </p>
            <p className="mt-1 text-sm capitalize text-ink/60">
              {template.persona.tone} tone
            </p>
            <div className="mt-4 rounded-xl bg-oat/60 p-4 text-sm text-ink">
              {template.persona.welcome}
            </div>
          </div>
        </div>
      </Reveal>

      {/* FAQ */}
      <section className="border-t border-border/60 bg-oat/30">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <Reveal>
            <h2 className="text-center font-display text-3xl text-oxblood">
              {template.industry} — frequently asked
            </h2>
          </Reveal>
          <div className="mt-8 space-y-3">
            {cfg.faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border border-border bg-card p-5 [&_svg]:open:rotate-180"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium text-ink marker:content-none">
                  {f.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Reveal className="rounded-3xl bg-oxblood px-8 py-14 text-center text-cream">
          <h2 className="font-display text-3xl">
            Set up your {template.industry.toLowerCase()} assistant today
          </h2>
          <Magnetic strength={0.3}>
            <Button
              asChild
              size="lg"
              className="mt-6 bg-cream text-oxblood hover:bg-cream/90"
            >
              <Link href="/signup">Start free trial</Link>
            </Button>
          </Magnetic>
          <p className="mt-4 text-sm text-cream/80">
            No card to start · cancel anytime
          </p>
        </Reveal>
      </section>
    </div>
  );
}
