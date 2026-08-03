"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

import { Chat, type ChatConfig } from "@/components/widget/chat";
import { cn } from "@/lib/utils";

/**
 * Floating launcher bubble + chat panel.
 *
 * `contained` keeps it absolutely positioned inside a relative demo frame (used
 * on the Install page). Without it, it pins to the viewport like the real embed.
 * The production version of this lives in public/embed.js (vanilla, shadow DOM +
 * iframe); this React version powers the in-dashboard demo.
 */
export function ChatBubble({
  config,
  contained = false,
}: {
  config: ChatConfig;
  contained?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn(contained ? "absolute" : "fixed", "bottom-5 right-5 z-50")}>
      {open && (
        <div className="mb-3 h-[520px] w-[360px] max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <Chat config={config} />
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition-transform hover:scale-105"
        style={{ backgroundColor: config.brandColor }}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}
