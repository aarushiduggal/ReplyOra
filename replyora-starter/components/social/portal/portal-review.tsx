"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

import type { ClientPost } from "@/lib/social/posts";
import type { ApprovalStatus } from "@/lib/social/approvals";
import { PLATFORM_LABEL } from "@/lib/social/types";
import { decideAction } from "@/app/portal/[token]/actions";

const TINTS = ["#5C1A1A", "#7A2E2A", "#B26B62", "#3F1011", "#8A4A42", "#D9AFA6"];
function tintFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return TINTS[h % TINTS.length] ?? "#5C1A1A";
}

export function PortalReview({
  token,
  posts,
  approvals,
  agencyReplies,
}: {
  token: string;
  posts: ClientPost[];
  approvals: Record<string, ApprovalStatus>;
  agencyReplies: Record<string, string | null>;
}) {
  const scheduled = posts.filter((p) => p.scheduledFor);

  return (
    <div className="space-y-10">
      {/* Planned grid */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/85">
          Planned grid
        </p>
        {scheduled.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-ink/20 px-4 py-10 text-center text-[12px] text-ink/80">
            Nothing shared yet — check back soon.
          </p>
        ) : (
          <div className="mx-auto mt-4 grid max-w-[360px] grid-cols-3 gap-0.5 bg-oxblood/10">
            {scheduled.map((p) => (
              <div
                key={p.id}
                className="relative aspect-square"
                style={{ backgroundColor: tintFor(p.id) }}
                title={p.caption}
              >
                <span className="absolute inset-x-1 bottom-1 line-clamp-2 text-[8.5px] leading-tight text-cream/90">
                  {p.caption.split(" ").slice(0, 6).join(" ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Review queue */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/85">
          For your review
        </p>
        <div className="mt-4 space-y-3">
          {posts.filter((p) => approvals[p.id]).length === 0 ? (
            <p className="rounded-xl border border-dashed border-ink/20 px-4 py-10 text-center text-[12px] text-ink/80">
              No posts are waiting on you right now.
            </p>
          ) : (
            posts
              .filter((p) => approvals[p.id])
              .map((p) => (
                <ReviewRow key={p.id} token={token} post={p} status={approvals[p.id]!} agencyReply={agencyReplies[p.id] ?? null} />
              ))
          )}
        </div>
      </section>
    </div>
  );
}

function ReviewRow({
  token,
  post,
  status,
  agencyReply,
}: {
  token: string;
  post: ClientPost;
  status: ApprovalStatus;
  agencyReply: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [, startTransition] = useTransition();

  function decide(next: "approved" | "changes", n: string) {
    startTransition(async () => {
      await decideAction(token, post.id, next, n);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-ink/10 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">
            {post.caption ? post.caption.slice(0, 80) : "(untitled)"}
          </p>
          <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-ink/80">
            {post.scheduledFor?.slice(0, 10)} · {PLATFORM_LABEL[post.platform]}
          </p>
        </div>
        {status === "approved" && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-800">
            Approved
          </span>
        )}
        {status === "changes" && (
          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-800">
            Changes requested
          </span>
        )}
      </div>

      {status === "changes" && agencyReply && (
        <p className="mt-2 rounded-lg bg-oxblood/5 px-3 py-2 text-[12px] text-ink/85">
          <span className="font-semibold text-oxblood">Your team replied:</span> “{agencyReply}”
        </p>
      )}

      {status === "pending" && (
        <div className="mt-3">
          {open ? (
            <div className="space-y-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="What would you like changed?"
                className="w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => decide("changes", note)}
                  className="rounded-full bg-oxblood px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-cream"
                >
                  Send request
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/80"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => decide("approved", "")}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-90"
              >
                <Check className="h-3.5 w-3.5" /> Approve
              </button>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/25 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/80 hover:border-oxblood hover:text-oxblood"
              >
                <X className="h-3.5 w-3.5" /> Request changes
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
