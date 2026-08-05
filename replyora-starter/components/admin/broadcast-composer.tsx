"use client";

import { useMemo, useState, useTransition } from "react";
import { Send, Users } from "lucide-react";

import { adminSendBroadcast } from "@/lib/admin/actions";
import { toast } from "@/lib/toast";

export interface BroadcastAudience {
  key: string;
  label: string;
  count: number;
}

export function BroadcastComposer({ audiences }: { audiences: BroadcastAudience[] }) {
  const [pending, start] = useTransition();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audienceKey, setAudienceKey] = useState(audiences[0]?.key ?? "all");

  const audience = useMemo(
    () => audiences.find((a) => a.key === audienceKey) ?? audiences[0],
    [audiences, audienceKey],
  );
  const recipients = audience?.count ?? 0;

  const field =
    "w-full rounded-lg border border-oxblood/15 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-oxblood focus:outline-none";

  return (
    <div className="rounded-2xl border border-oxblood/10 bg-white p-5">
      <h2 className="mb-3 font-semibold text-ink">New announcement</h2>
      <div className="space-y-3">
        {/* audience chips */}
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink/50">
            Send to
          </p>
          <div className="flex flex-wrap gap-2">
            {audiences.map((a) => {
              const on = a.key === audienceKey;
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => setAudienceKey(a.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    on
                      ? "border-oxblood bg-oxblood text-cream"
                      : "border-oxblood/20 text-ink/70 hover:border-oxblood/40"
                  }`}
                >
                  {a.label}
                  <span className={`rounded-full px-1.5 text-[10px] ${on ? "bg-cream/25" : "bg-oxblood/10 text-oxblood"}`}>
                    {a.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

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
          placeholder="Message to the selected agency owners…"
          className={field}
        />
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs text-ink/50">
            <Users className="h-3.5 w-3.5" />
            Reaches <span className="font-semibold text-ink/70">{recipients}</span>{" "}
            agency owner{recipients === 1 ? "" : "s"}
          </p>
          <button
            disabled={pending || !subject.trim() || !body.trim() || recipients === 0}
            onClick={() =>
              start(async () => {
                const label = audience?.label ?? "All agencies";
                await adminSendBroadcast(subject.trim(), body.trim(), label);
                setSubject("");
                setBody("");
                toast({ title: `Sent to ${recipients} agencies`, type: "success" });
              })
            }
            className="inline-flex items-center gap-1.5 rounded-full bg-oxblood px-4 py-2 text-sm font-medium text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> Send
          </button>
        </div>
      </div>
    </div>
  );
}
