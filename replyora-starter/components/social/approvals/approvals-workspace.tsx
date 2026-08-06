"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, MessageSquareWarning, Send } from "lucide-react";

import type { ClientPost } from "@/lib/social/posts";
import type { ApprovalStatus, ChangeResolution } from "@/lib/social/approvals";
import { PLATFORM_LABEL } from "@/lib/social/types";
import {
  sendForReviewAction,
  respondToChangeAction,
} from "@/app/(social)/clients/[id]/approvals/actions";
import { GuideTrigger } from "@/components/social/guide";
import { toast } from "@/lib/toast";

export function ApprovalsWorkspace({
  clientId,
  clientName,
  posts,
  approvals,
  notes,
  replies,
  resolutions,
  portalUrl,
}: {
  clientId: string;
  clientName: string;
  posts: ClientPost[];
  approvals: Record<string, ApprovalStatus>;
  notes: Record<string, string | null>;
  replies: Record<string, string | null>;
  resolutions: Record<string, ChangeResolution | null>;
  portalUrl: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  const pending = posts.filter((p) => approvals[p.id] === "pending");
  const approved = posts.filter((p) => approvals[p.id] === "approved");
  const changes = posts.filter((p) => approvals[p.id] === "changes");
  const notSent = posts.filter((p) => !approvals[p.id]);

  function copyLink() {
    navigator.clipboard?.writeText(portalUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  function send(postId: string) {
    startTransition(async () => {
      await sendForReviewAction(clientId, postId);
      router.refresh();
    });
  }

  function respond(
    postId: string,
    input: { reply?: string; resolution?: ChangeResolution },
  ) {
    startTransition(async () => {
      await respondToChangeAction(clientId, postId, input);
      router.refresh();
      if (input.resolution) {
        toast({ title: `Marked ${RESOLUTION_LABEL[input.resolution]}`, type: "success" });
      } else {
        toast({ title: "Reply sent to client", type: "success" });
      }
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/85">
          <span className="text-oxblood">( 07 )</span> Approvals
          <GuideTrigger pageKey="approvals" clientId={clientId} />
        </div>
      </div>

      {/* Client portal link */}
      <div className="rounded-2xl border border-oxblood/15 bg-oat/20 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-oxblood">
          Client portal link
        </p>
        <p className="mt-1 text-[12px] font-medium text-ink/90">
          Share this read-only link with {clientName} — they review the planned grid
          and Approve or Request changes. No login needed.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <input
            readOnly
            value={portalUrl}
            className="flex-1 rounded-lg border border-ink/15 bg-white px-3 py-2 text-[12px] text-ink/80"
          />
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 rounded-full bg-oxblood px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="In review" n={pending.length} tone="text-amber-700" />
        <Stat label="Approved" n={approved.length} tone="text-emerald-700" />
        <Stat label="Changes requested" n={changes.length} tone="text-rose-700" />
      </div>

      <Group title={`In review (${pending.length})`} posts={pending} approvals={approvals} notes={notes} replies={replies} resolutions={resolutions} onSend={send} onRespond={respond} />
      <Group title={`Changes requested (${changes.length})`} posts={changes} approvals={approvals} notes={notes} replies={replies} resolutions={resolutions} onSend={send} onRespond={respond} />
      <Group title={`Approved (${approved.length})`} posts={approved} approvals={approvals} notes={notes} replies={replies} resolutions={resolutions} onSend={send} onRespond={respond} />
      <Group title={`Not sent yet (${notSent.length})`} posts={notSent} approvals={approvals} notes={notes} replies={replies} resolutions={resolutions} onSend={send} onRespond={respond} showSend />
    </div>
  );
}

const RESOLUTION_LABEL: Record<ChangeResolution, string> = {
  pending: "Pending",
  resolved: "Resolved",
  unresolved: "Not resolved",
};

function Stat({ label, n, tone }: { label: string; n: number; tone: string }) {
  return (
    <div className="rounded-xl border border-ink/10 px-4 py-3">
      <p className={`font-display text-3xl ${tone}`}>{n}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/85">{label}</p>
    </div>
  );
}

function Group({
  title,
  posts,
  approvals,
  notes,
  replies,
  resolutions,
  onSend,
  onRespond,
  showSend,
}: {
  title: string;
  posts: ClientPost[];
  approvals: Record<string, ApprovalStatus>;
  notes: Record<string, string | null>;
  replies: Record<string, string | null>;
  resolutions: Record<string, ChangeResolution | null>;
  onSend: (id: string) => void;
  onRespond: (id: string, input: { reply?: string; resolution?: ChangeResolution }) => void;
  showSend?: boolean;
}) {
  if (posts.length === 0) return null;
  return (
    <div className="mt-8">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85">{title}</p>
      <div className="space-y-2">
        {posts.map((p) => (
          <div key={p.id} className="rounded-xl border border-ink/10 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">
                  {p.caption ? p.caption.slice(0, 70) : "(untitled)"}
                </p>
                <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-ink/85">
                  {p.scheduledFor?.slice(0, 10) ?? "Unscheduled"} · {PLATFORM_LABEL[p.platform]}
                </p>
              </div>
              {showSend && (
                <button
                  type="button"
                  onClick={() => onSend(p.id)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-oxblood/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-oxblood hover:bg-oxblood hover:text-cream"
                >
                  <Send className="h-3 w-3" /> Send for review
                </button>
              )}
            </div>

            {approvals[p.id] === "changes" && (
              <ChangeThread
                postId={p.id}
                clientNote={notes[p.id] ?? null}
                reply={replies[p.id] ?? null}
                resolution={resolutions[p.id] ?? null}
                onRespond={onRespond}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** The client's change request + the agency's reply and resolution controls. */
function ChangeThread({
  postId,
  clientNote,
  reply,
  resolution,
  onRespond,
}: {
  postId: string;
  clientNote: string | null;
  reply: string | null;
  resolution: ChangeResolution | null;
  onRespond: (id: string, input: { reply?: string; resolution?: ChangeResolution }) => void;
}) {
  const [draft, setDraft] = useState(reply ?? "");
  const current: ChangeResolution = resolution ?? "pending";

  const badgeTone: Record<ChangeResolution, string> = {
    pending: "bg-amber-100 text-amber-800",
    resolved: "bg-emerald-100 text-emerald-800",
    unresolved: "bg-rose-100 text-rose-800",
  };

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-rose-200/70 bg-rose-50/40 p-3">
      {/* Client's request */}
      {clientNote && (
        <p className="flex items-start gap-1.5 text-[12px] text-rose-800">
          <MessageSquareWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span><span className="font-semibold">Client:</span> “{clientNote}”</span>
        </p>
      )}

      {/* Status + resolution controls */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${badgeTone[current]}`}>
          {RESOLUTION_LABEL[current]}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/50">Mark as:</span>
        {(["pending", "resolved", "unresolved"] as ChangeResolution[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onRespond(postId, { resolution: r })}
            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors ${
              current === r
                ? "border-oxblood bg-oxblood text-cream"
                : "border-ink/20 text-ink/70 hover:border-oxblood hover:text-oxblood"
            }`}
          >
            {RESOLUTION_LABEL[r]}
          </button>
        ))}
      </div>

      {/* Agency reply */}
      <div className="space-y-1.5">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="Reply to the client — “here are the changes I made…”"
          className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-[12px] text-ink outline-none focus:border-oxblood"
        />
        <button
          type="button"
          onClick={() => onRespond(postId, { reply: draft.trim() })}
          disabled={!draft.trim() || draft.trim() === (reply ?? "")}
          className="rounded-full bg-oxblood px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cream transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Send reply
        </button>
        {reply && (
          <p className="text-[11px] text-ink/70">
            <span className="font-semibold text-oxblood">You replied:</span> “{reply}”
          </p>
        )}
      </div>
    </div>
  );
}
