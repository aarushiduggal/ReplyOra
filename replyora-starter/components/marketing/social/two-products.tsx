import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

import { Reveal } from "@/components/marketing/motion";
import { FeedPhone } from "@/components/marketing/social/feed-grid";

/**
 * "Two products, one studio" — the feed (social content) and the website
 * chatbox shown side by side as the two things Replyora does. Compact, so it
 * replaces the two long standalone sections.
 */

const CHAT: { role: "user" | "assistant"; text: string }[] = [
  { role: "assistant", text: "Hi! Welcome to Rosewood 🌹 How can I help today?" },
  { role: "user", text: "Do you have anything free this Saturday?" },
  {
    role: "assistant",
    text: "We do — a couple of afternoon spots left. Want me to pop you in?",
  },
];

function ChatCard() {
  return (
    <div className="overflow-hidden rounded-3xl border border-cream/15 bg-cream shadow-2xl shadow-black/20">
      <div className="flex items-center gap-3 bg-oxblood px-4 py-3 text-cream">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/15">
          <MessageCircle className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <p className="font-display text-sm">Rosewood assistant</p>
          <p className="text-[11px] text-cream/70">Online · replies instantly</p>
        </div>
      </div>
      <div className="space-y-3 bg-cream px-4 py-5">
        {CHAT.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-sm bg-oxblood text-cream"
                  : "rounded-bl-sm border border-oxblood/10 bg-white text-ink"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div className="flex justify-start">
          <div className="flex gap-1 rounded-2xl rounded-bl-sm border border-oxblood/10 bg-white px-3.5 py-3">
            {[0, 1, 2].map((d) => (
              <span
                key={d}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-rose"
                style={{ animationDelay: `${d * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TwoProducts() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose">
            Two products, one studio
          </p>
          <h2 className="mt-3 font-display text-4xl text-oxblood sm:text-5xl">
            Your feed and your website — both handled.
          </h2>
          <p className="mt-4 text-ink/70">
            The content that fills your grid, and the assistant that answers your
            site. Two products, one calm workspace.
          </p>
        </Reveal>

        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-2">
          {/* Product 01 — the feed */}
          <Reveal className="h-full">
            <div className="flex h-full flex-col rounded-[2rem] border border-oxblood/10 bg-white p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose">
                01 · The feed
              </p>
              <h3 className="mt-2 font-display text-2xl text-wine">
                Planned, designed, posted.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                On-brand posts, carousels and reels for Instagram &amp; TikTok — a
                month at a time, scheduled for you.
              </p>
              <div className="flex flex-1 items-center justify-center py-8">
                <div className="w-full max-w-[19rem]">
                  <FeedPhone />
                </div>
              </div>
              <Link
                href="/product"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-oxblood hover:gap-2.5"
              >
                Explore the feed tools <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>

          {/* Product 02 — the website chatbox */}
          <Reveal delay={0.1} className="h-full">
            <div className="flex h-full flex-col rounded-[2rem] bg-wine p-8 text-cream">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blush">
                02 · The website chatbox
              </p>
              <h3 className="mt-2 font-display text-2xl text-cream">
                Answered 24/7.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-cream/75">
                A warm AI assistant on your site — answering questions, capturing
                leads and booking enquiries while you sleep.
              </p>
              <div className="flex flex-1 items-center justify-center py-8">
                <div className="w-full max-w-[22rem]">
                  <ChatCard />
                </div>
              </div>
              <Link
                href="/product#chatbox"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-cream hover:gap-2.5"
              >
                Explore the chatbox <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
