"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Clock, Loader2, Trash2 } from "lucide-react";

import { deletePost, markStatus } from "@/lib/social/actions";
import { PLATFORM_LABEL, type Platform, type PostStatus } from "@/lib/social/types";
import { formatDateTime } from "@/lib/format";
import { toast } from "@/lib/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface SocialRow {
  id: string;
  platform: Platform;
  pillar: string;
  caption: string;
  hashtags: string[];
  status: PostStatus;
  scheduledFor: string | null;
}

const STATUS_PILL: Record<PostStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-ink/8 text-ink/60" },
  scheduled: { label: "Scheduled", className: "bg-rose/15 text-oxblood" },
  published: { label: "Published", className: "bg-oxblood text-cream" },
};

function Row({ row, onGone }: { row: SocialRow; onGone: (id: string) => void }) {
  const [status, setStatus] = useState(row.status);
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  const pill = STATUS_PILL[status];

  function publish() {
    setBusy("publish");
    start(async () => {
      await markStatus(row.id, "published");
      setStatus("published");
      setBusy(null);
      toast({ title: "Marked as published", type: "success" });
    });
  }

  function remove() {
    setBusy("delete");
    start(async () => {
      await deletePost(row.id);
      onGone(row.id);
      toast({ title: "Post deleted", type: "info" });
    });
  }

  return (
    <Card>
      <CardContent className="space-y-2.5 p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">
            {PLATFORM_LABEL[row.platform]}
          </span>
          <span className="text-xs text-muted-foreground">· {row.pillar}</span>
          <span
            className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${pill.className}`}
          >
            {pill.label}
          </span>
        </div>

        {row.scheduledFor && status !== "published" && (
          <p className="flex items-center gap-1 text-xs text-sky-700">
            <Clock className="h-3.5 w-3.5" /> {formatDateTime(row.scheduledFor)}
          </p>
        )}

        <p className="whitespace-pre-line text-sm text-ink/80">{row.caption}</p>

        {row.hashtags.length > 0 && (
          <p className="text-xs text-oxblood">{row.hashtags.join(" ")}</p>
        )}

        <div className="flex items-center gap-2 pt-1">
          {status !== "published" && (
            <Button size="sm" variant="outline" disabled={pending} onClick={publish}>
              {pending && busy === "publish" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Mark published
            </Button>
          )}
          <Button size="sm" variant="ghost" disabled={pending} onClick={remove}>
            {pending && busy === "delete" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function SocialCalendar({ rows }: { rows: SocialRow[] }) {
  const [items, setItems] = useState(rows);
  const [filter, setFilter] = useState<"all" | PostStatus>("all");

  const counts = useMemo(() => {
    const c = { all: items.length, draft: 0, scheduled: 0, published: 0 };
    for (const r of items) c[r.status] += 1;
    return c;
  }, [items]);

  const visible = filter === "all" ? items : items.filter((r) => r.status === filter);

  const tabs: { key: "all" | PostStatus; label: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "scheduled", label: `Scheduled (${counts.scheduled})` },
    { key: "draft", label: `Drafts (${counts.draft})` },
    { key: "published", label: `Published (${counts.published})` },
  ];

  function onGone(id: string) {
    setItems((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === t.key
                ? "bg-oxblood text-white"
                : "bg-oat/50 text-muted-foreground hover:bg-oat"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nothing here yet. Head to the Content Studio to generate your first
            posts.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {visible.map((r) => (
            <Row key={r.id} row={r} onGone={onGone} />
          ))}
        </div>
      )}
    </div>
  );
}
