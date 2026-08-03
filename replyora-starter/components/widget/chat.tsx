"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarCheck, Send } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LeadField, TimeSlot } from "@/lib/data/types";

export interface ChatConfig {
  publicKey: string;
  name: string;
  welcomeMessage: string;
  suggestedQuestions: string[];
  brandColor: string;
  leadFields: LeadField[];
  businessName?: string;
  showBranding?: boolean;
  /** When present, the assistant can offer a native "pick a time" booking flow. */
  bookingSlots?: TimeSlot[];
  /** When present, booking sends the visitor to this external scheduling link
   * (Calendly / Google Calendar) instead of the native slots. */
  bookingUrl?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** True when a human teammate sent this (via live takeover). */
  human?: boolean;
}

let idSeq = 0;
const nextId = () => `m_${Date.now()}_${idSeq++}`;

/** Stable conversation id (a real UUID so it persists in live mode). */
function makeConversationId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
  }
}

/**
 * Shared chat UI — used by the in-dashboard Preview and the public widget page.
 * Streams replies from POST /api/chat (token-by-token), exactly like the real
 * runtime; only the endpoint behind it changes when Claude is wired up.
 */
export function Chat({ config }: { config: ChatConfig }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const visitorId = useRef(`vis_${Math.random().toString(36).slice(2)}`);
  const conversationId = useRef(makeConversationId());
  const [bookingOpen, setBookingOpen] = useState(false);
  // Real-time handoff: cursor + dedup for teammate messages we've already shown.
  const pollCursor = useRef(new Date().toISOString());
  const seenHuman = useRef<Set<string>>(new Set());
  const [humanJoined, setHumanJoined] = useState(false);

  function bookSlot(slot: TimeSlot) {
    setBookingOpen(false);
    setMessages((prev) => [
      ...prev,
      {
        id: nextId(),
        role: "assistant",
        content: `You're booked in for ${slot.label}. I've sent a confirmation to your email — see you then! 🌿`,
      },
    ]);
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streaming]);

  // Real-time handoff — poll for messages a human teammate sends after taking
  // over, and drop them into the thread. Only runs once the visitor has spoken.
  const started = messages.length > 0;
  useEffect(() => {
    if (!started) return;
    let stopped = false;

    async function poll() {
      if (stopped || streaming) return;
      try {
        const params = new URLSearchParams({
          publicKey: config.publicKey,
          conversationId: conversationId.current,
          after: pollCursor.current,
        });
        const res = await fetch(`/api/chat/poll?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          messages: { content: string; createdAt: string }[];
        };
        const fresh = (data.messages ?? []).filter((m) => {
          const sig = `${m.createdAt}|${m.content}`;
          if (seenHuman.current.has(sig)) return false;
          seenHuman.current.add(sig);
          return true;
        });
        if (fresh.length === 0) return;
        for (const m of fresh) {
          if (m.createdAt > pollCursor.current) pollCursor.current = m.createdAt;
        }
        setHumanJoined(true);
        setMessages((prev) => [
          ...prev,
          ...fresh.map((m) => ({
            id: nextId(),
            role: "assistant" as const,
            content: m.content,
            human: true,
          })),
        ]);
      } catch {
        // transient — try again next tick
      }
    }

    const timer = setInterval(poll, 4000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [started, streaming, config.publicKey]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || streaming) return;

    const userMsg: ChatMessage = { id: nextId(), role: "user", content };
    const assistantId = nextId();
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey: config.publicKey,
          conversationId: conversationId.current,
          visitorId: visitorId.current,
          message: content,
        }),
      });

      if (!res.body) throw new Error("No response stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: acc } : m,
          ),
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  "Sorry — I couldn't reach the assistant just now. Please try again.",
              }
            : m,
        ),
      );
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-cream/40">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 text-white"
        style={{ backgroundColor: config.brandColor }}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
          {initials(config.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{config.name}</p>
          {config.businessName && (
            <p className="truncate text-xs text-white/75">
              {config.businessName}
            </p>
          )}
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-white/80">
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
          Online
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <Bubble side="bot" brandColor={config.brandColor}>
          {config.welcomeMessage}
        </Bubble>

        {messages.map((m) =>
          m.role === "assistant" && m.content === "" ? (
            <TypingBubble key={m.id} />
          ) : (
            <Bubble
              key={m.id}
              side={m.role === "user" ? "user" : "bot"}
              brandColor={config.brandColor}
              human={m.human}
            >
              {m.content}
            </Bubble>
          ),
        )}

        {humanJoined && (
          <p className="text-center text-[11px] font-medium text-muted-foreground">
            A team member has joined the chat
          </p>
        )}

        {!started && config.suggestedQuestions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {config.suggestedQuestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-ink shadow-sm transition-colors hover:bg-oat"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Booking flow — external calendar takes priority when connected */}
      {config.bookingUrl ? (
        <div className="border-t border-border bg-card px-3 py-2">
          <a
            href={config.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-oat"
          >
            <CalendarCheck className="h-3.5 w-3.5" />
            Book on our calendar
          </a>
        </div>
      ) : (
        config.bookingSlots && config.bookingSlots.length > 0 && (
        <div className="border-t border-border bg-card px-3 py-2">
          {!bookingOpen ? (
            <button
              type="button"
              onClick={() => setBookingOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-oat"
            >
              <CalendarCheck className="h-3.5 w-3.5" />
              Book a time
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium text-ink">Pick a time</p>
              <div className="grid grid-cols-2 gap-2">
                {config.bookingSlots.slice(0, 6).map((s) => (
                  <button
                    key={s.start}
                    type="button"
                    onClick={() => bookSlot(s)}
                    className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-ink transition-colors hover:bg-oat"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        )
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex items-center gap-2 border-t border-border bg-card px-3 py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={streaming || input.trim() === ""}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40"
          style={{ backgroundColor: config.brandColor }}
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      {config.showBranding !== false && (
        <div className="flex items-center justify-center gap-1.5 bg-card pb-2 text-[11px] text-muted-foreground">
          Powered by
          <Logo asLink={false} height={14} />
        </div>
      )}
    </div>
  );
}

function Bubble({
  side,
  brandColor,
  human,
  children,
}: {
  side: "user" | "bot";
  brandColor: string;
  human?: boolean;
  children: React.ReactNode;
}) {
  if (side === "user") {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[82%] rounded-2xl rounded-br-sm px-3.5 py-2 text-sm text-white"
          style={{ backgroundColor: brandColor }}
        >
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start">
      {human && (
        <span className="mb-0.5 ml-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Team member
        </span>
      )}
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border px-3.5 py-2 text-sm shadow-sm",
          human
            ? "border-oxblood/20 bg-oat text-ink"
            : "border-border bg-card text-ink",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3 shadow-sm">
        <Dot className="[animation-delay:0ms]" />
        <Dot className="[animation-delay:150ms]" />
        <Dot className="[animation-delay:300ms]" />
      </div>
    </div>
  );
}

function Dot({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50",
        className,
      )}
    />
  );
}
