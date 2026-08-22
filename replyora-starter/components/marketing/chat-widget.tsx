"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

/**
 * Floating website-chatbox demo. A bottom-right bubble opens a small on-brand
 * chat panel that posts to /api/demo-chat and shows the assistant's reply. It's
 * the Replyora "website chatbox" product, live on our own marketing site.
 *
 * Everything the visitor types is sent as data to the API; the server-side
 * system context handles prompt-injection defence.
 */

interface Msg {
  role: "user" | "assistant";
  text: string;
}

const GREETING: Msg = {
  role: "assistant",
  text: "Hey! I'm the Replyora assistant 👋 Ask me anything about planning your Instagram & TikTok — or how this website chatbox works.",
};

const SUGGESTIONS = [
  "What does Replyora do?",
  "How much is it?",
  "Book a demo",
];

/** Friendly labels for links the assistant mentions. */
const LINK_LABELS: Record<string, string> = {
  "/waitlist": "join the beta waitlist",
  "/pricing": "see pricing",
  "/demo": "book a demo",
  "/product": "the product",
  "/work": "our work",
  "/about": "about us",
  "/faq": "the FAQ",
};

/** Turn URLs and internal paths in assistant replies into clickable links. */
function renderRich(text: string): React.ReactNode[] {
  const re = /(https?:\/\/[^\s)]+|\/(?:signup|pricing|demo|product|work|about|faq)\b)/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const tok = match[0];
    const isExt = /^https?:/.test(tok);
    out.push(
      <a
        key={key++}
        href={tok}
        target={isExt ? "_blank" : undefined}
        rel={isExt ? "noopener noreferrer" : undefined}
        className="font-semibold text-oxblood underline underline-offset-2"
      >
        {isExt ? "book a demo" : LINK_LABELS[tok] ?? tok}
      </a>,
    );
    last = match.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setInput("");
    const history = messages.slice(-8);
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setSending(true);
    try {
      const res = await fetch("/api/demo-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });
      const data = (await res.json()) as { reply?: string };
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text:
            data.reply ||
            "Sorry — I'm having a moment. Try again, or book a quick demo and a human will help.",
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "I couldn't reach the server just now. Please try again in a moment.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[30rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-oxblood/15 bg-cream shadow-2xl shadow-oxblood/20 sm:right-6">
          {/* Header */}
          <div className="flex items-center gap-3 bg-oxblood px-4 py-3 text-cream">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/15">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-sm">Replyora assistant</p>
              <p className="text-[11px] text-cream/70">Answers 24/7 · demo</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-cream/80 hover:bg-cream/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3.5 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
                    m.role === "user"
                      ? "rounded-br-sm bg-oxblood text-cream"
                      : "rounded-bl-sm border border-oxblood/10 bg-white text-ink"
                  }`}
                >
                  {m.role === "assistant" ? renderRich(m.text) : m.text}
                </div>
              </div>
            ))}

            {sending && (
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
            )}

            {messages.length === 1 && !sending && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-oxblood/20 bg-white px-3 py-1 text-[12px] text-wine transition-colors hover:bg-oxblood hover:text-cream"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-oxblood/10 bg-cream p-2.5"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              className="h-10 flex-1 rounded-full border border-oxblood/20 bg-white px-4 text-[13px] text-ink outline-none focus:border-oxblood"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-oxblood text-cream transition-opacity disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Bubble */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Chat with Replyora"}
        className="fixed bottom-5 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-oxblood text-cream shadow-xl shadow-oxblood/30 transition-transform hover:scale-105 sm:right-6"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}
