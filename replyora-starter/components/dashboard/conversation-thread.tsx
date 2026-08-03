"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bot, Hand, Loader2, Lock, Send } from "lucide-react";

import { sendHumanReply, setHandledBy } from "@/lib/data/actions";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/format";
import type { ConversationMessage, HandledBy } from "@/lib/data/types";

/**
 * Live transcript + human-handoff composer. When a teammate takes over, they
 * can reply straight into the conversation; their messages are tagged "You".
 */
export function ConversationThread({
  conversationId,
  initialMessages,
  initialHandledBy,
  canHandoff,
}: {
  conversationId: string;
  initialMessages: ConversationMessage[];
  initialHandledBy: HandledBy;
  canHandoff: boolean;
}) {
  const [messages, setMessages] = useState<ConversationMessage[]>(initialMessages);
  const [handledBy, setHandled] = useState<HandledBy>(initialHandledBy);
  const [input, setInput] = useState("");
  const [pending, start] = useTransition();

  function takeOver() {
    setHandled("human");
    start(async () => {
      await setHandledBy(conversationId, "human");
      // Owner alert — in-app now; email/SMS/push via the notifications seam.
      toast({ title: "You've taken over this chat", type: "info" });
    });
  }

  function handBack() {
    setHandled("assistant");
    start(async () => {
      await setHandledBy(conversationId, "assistant");
      toast({ title: "Handed back to the assistant", type: "info" });
    });
  }

  function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    if (handledBy !== "human") setHandled("human");
    start(async () => {
      const msg = await sendHumanReply(conversationId, text);
      setMessages((prev) => [...prev, msg]);
    });
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Transcript</CardTitle>
        {handledBy === "human" ? (
          <Badge variant="warning" className="gap-1">
            <Hand className="h-3 w-3" /> You&apos;re handling this
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <Bot className="h-3 w-3" /> Assistant is handling
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {messages.map((m) => {
          const isVisitor = m.role === "user";
          const isHuman = m.author === "human";
          return (
            <div
              key={m.id}
              className={isVisitor ? "flex justify-end" : "flex justify-start"}
            >
              <div className="max-w-[80%]">
                <div
                  className={
                    isVisitor
                      ? "rounded-2xl rounded-br-sm bg-oxblood px-4 py-2.5 text-sm text-cream"
                      : isHuman
                        ? "rounded-2xl rounded-bl-sm border border-oxblood/25 bg-oxblood/5 px-4 py-2.5 text-sm text-ink"
                        : "rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-2.5 text-sm text-ink shadow-sm"
                  }
                >
                  {m.content}
                </div>
                <p
                  className={`mt-1 text-[11px] text-muted-foreground ${
                    isVisitor ? "text-right" : "text-left"
                  }`}
                >
                  {isVisitor ? "Visitor" : isHuman ? "You" : "Assistant"} ·{" "}
                  {formatTime(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>

      {/* Handoff / reply composer */}
      <div className="border-t border-border p-4">
        {!canHandoff ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-oat/60 px-4 py-3">
            <span className="inline-flex items-center gap-2 text-sm text-oxblood">
              <Lock className="h-4 w-4" />
              Reply to visitors yourself with human handoff — a Growth feature.
            </span>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/settings">Upgrade to Growth</Link>
            </Button>
          </div>
        ) : handledBy === "assistant" ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              The assistant is replying automatically.
            </span>
            <Button size="sm" onClick={takeOver} disabled={pending}>
              <Hand className="h-4 w-4" /> Take over to reply
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={2}
                placeholder="Reply as a team member…"
                className="flex-1 resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-oxblood"
              />
              <Button onClick={send} disabled={pending || !input.trim()}>
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send
              </Button>
            </div>
            <button
              type="button"
              onClick={handBack}
              disabled={pending}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-oxblood disabled:opacity-50"
            >
              <Bot className="h-3.5 w-3.5" /> Hand back to the assistant
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
