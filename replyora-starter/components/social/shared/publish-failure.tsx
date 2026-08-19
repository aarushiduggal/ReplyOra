"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, RotateCw } from "lucide-react";

import { publishNowAction } from "@/app/(social)/clients/[id]/calendar/actions";
import { toast } from "@/lib/toast";

/**
 * Publish-failure notice with a retry.
 *
 * publish_error was recorded by the publisher and read by no screen, so a
 * scheduled post could silently never go out. Shared across the calendar, grid
 * and approvals so a failure looks the same wherever it's noticed.
 *
 * Retry runs publishNowAction — the same path the cron uses — so it either
 * succeeds and clears the error, or reports the current reason rather than the
 * stale one. Waiting for the next 15-minute tick would leave the user guessing.
 */
export function PublishFailure({
  clientId,
  postId,
  error,
  compact = false,
}: {
  clientId: string;
  postId: string;
  error: string;
  /** Tight spaces (grid tiles, list rows) get the icon + a short label only. */
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function retry() {
    start(async () => {
      try {
        const res = await publishNowAction(clientId, postId);
        toast(
          res.ok
            ? { title: "Published", body: "That post is live now.", type: "success" }
            : {
                title: "Still couldn't publish",
                body: res.error ?? "Please check the post and try again.",
                type: "error",
              },
        );
        router.refresh();
      } catch {
        toast({ title: "Couldn't reach the publisher.", type: "error" });
      }
    });
  }

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive"
          title={error}
        >
          <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
          Didn&apos;t publish
        </span>
        <button
          type="button"
          onClick={retry}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-full border border-ink/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/75 transition-colors hover:border-ink/50 hover:text-ink disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
          ) : (
            <RotateCw className="h-2.5 w-2.5" />
          )}
          Retry
        </button>
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
      <div className="min-w-0 flex-1 text-[13px] leading-relaxed text-ink/85">
        <strong className="font-semibold text-ink">This post didn&apos;t publish.</strong>{" "}
        {error}
      </div>
      <button
        type="button"
        onClick={retry}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-porcelain transition-opacity disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCw className="h-3 w-3" />}
        Retry now
      </button>
    </div>
  );
}
