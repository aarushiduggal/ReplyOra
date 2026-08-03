import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/motion";

const FAQS: { q: string; a: string }[] = [
  {
    q: "How is Replyora different from a normal chatbot?",
    a: "Most chatbots optimise for deflection — answering a question so you don't have to. Replyora optimises for revenue: it answers, then captures the lead, qualifies intent, and pushes toward a booking.",
  },
  {
    q: "Do I need any technical skills to set it up?",
    a: "No. Paste your FAQs or upload a PDF, pick a template, customise the persona, and drop one line of code on your site. Most owners are live in under 30 minutes.",
  },
  {
    q: "Where does it get its answers?",
    a: "From your own content — your knowledge base, business profile and opening hours. It only answers from what you provide, and says it'll follow up when it doesn't know.",
  },
  {
    q: "What happens after the 7-day trial?",
    a: "You pick a plan to continue. Your first invoice includes a one-time setup fee. Every plan includes lead capture, booking and qualification.",
  },
  {
    q: "Where does Replyora run — is it on social media?",
    a: "Replyora is a chat widget on your website. You add it with one line of code and it answers, captures and books right there. It doesn't run on Instagram, WhatsApp, Messenger, SMS or phone — it's website-only, by design.",
  },
  {
    q: "Is my data safe and separate from other businesses?",
    a: "Every workspace is isolated with row-level security. We never use one business's data to answer another's, and you can export or delete your data anytime.",
  },
  {
    q: "Can a human jump into a conversation?",
    a: "Anytime. Open a conversation and hit 'Take over' to reply yourself, then hand it back to the assistant when you're done.",
  },
];

export const metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about Replyora — setup, pricing, the website widget, data safety and human takeover.",
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Reveal className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-rose">
          FAQ
        </p>
        <h1 className="mt-3 font-display text-4xl text-oxblood">
          Frequently asked questions
        </h1>
      </Reveal>

      <div className="mt-10 space-y-3">
        {FAQS.map((f, i) => (
          <Reveal key={f.q} delay={Math.min(i * 0.04, 0.3)}>
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
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-12 rounded-2xl bg-oat/50 p-8 text-center">
        <h2 className="font-display text-2xl text-oxblood">
          Still have questions?
        </h2>
        <Button asChild className="mt-4">
          <Link href="/demo">Book a demo</Link>
        </Button>
      </Reveal>
    </div>
  );
}
