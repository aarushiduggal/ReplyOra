"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";

import { adminSendBroadcast } from "@/lib/admin/actions";
import { toast } from "@/lib/toast";

export function BroadcastComposer() {
  const [pending, start] = useTransition();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const field =
    "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-oxblood focus:outline-none";

  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <h2 className="mb-3 font-semibold text-ink">New announcement</h2>
      <div className="space-y-3">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className={field}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          placeholder="Message to all clients…"
          className={field}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-ink/40">
            Sends to all client owners. {/* TODO: real email fan-out */}
          </p>
          <button
            disabled={pending || !subject.trim() || !body.trim()}
            onClick={() =>
              start(async () => {
                await adminSendBroadcast(subject.trim(), body.trim());
                setSubject("");
                setBody("");
                toast({ title: "Announcement sent to all clients", type: "success" });
              })
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-oxblood px-4 py-2 text-sm font-medium text-cream hover:opacity-90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> Send to all
          </button>
        </div>
      </div>
    </div>
  );
}
