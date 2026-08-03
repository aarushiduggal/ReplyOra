"use client";

import { useState, useTransition } from "react";
import { CalendarPlus, Check, Loader2, Save, Sparkles } from "lucide-react";

import { draftPosts, savePost } from "@/lib/social/actions";
import type { GeneratedPost } from "@/lib/social/generate";
import {
  PILLARS,
  PLATFORMS,
  PLATFORM_LABEL,
  type Platform,
} from "@/lib/social/types";
import { toast } from "@/lib/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function Pills<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labels?: Record<string, string>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            value === o
              ? "bg-oxblood text-white"
              : "bg-oat/50 text-muted-foreground hover:bg-oat"
          }`}
        >
          {labels?.[o] ?? o}
        </button>
      ))}
    </div>
  );
}

function DraftCard({
  draft,
  platform,
  pillar,
  topic,
}: {
  draft: GeneratedPost;
  platform: Platform;
  pillar: string;
  topic: string;
}) {
  const [caption, setCaption] = useState(draft.caption);
  const [tags, setTags] = useState(draft.hashtags.join(" "));
  const [when, setWhen] = useState("");
  const [saved, setSaved] = useState<null | "draft" | "scheduled">(null);
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<"draft" | "schedule" | null>(null);

  function persist(mode: "draft" | "schedule") {
    setBusy(mode);
    start(async () => {
      const scheduledFor =
        mode === "schedule" && when ? new Date(when).toISOString() : null;
      await savePost({
        platform,
        pillar,
        topic,
        caption,
        hashtags: tags.split(/\s+/).filter(Boolean),
        scheduledFor,
      });
      setSaved(scheduledFor ? "scheduled" : "draft");
      setBusy(null);
      toast({
        title: scheduledFor ? "Post scheduled" : "Saved to drafts",
        type: "success",
      });
    });
  }

  if (saved) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-4 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" />
          {saved === "scheduled"
            ? "Scheduled — see it on the Content Calendar."
            : "Saved to drafts — find it on the Content Calendar."}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <Textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={5}
          className="text-sm"
        />
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-xs text-oxblood"
          placeholder="#hashtags"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => persist("draft")}
          >
            {pending && busy === "draft" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save draft
          </Button>
          <div className="flex items-center gap-1.5">
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="rounded-md border border-border bg-card px-2 py-1.5 text-xs text-ink"
            />
            <Button
              size="sm"
              disabled={pending || !when}
              onClick={() => persist("schedule")}
            >
              {pending && busy === "schedule" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CalendarPlus className="h-4 w-4" />
              )}
              Schedule
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ContentStudio({
  businessName,
  industry,
}: {
  businessName: string;
  industry: string;
}) {
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [pillar, setPillar] = useState<string>(PILLARS[0]);
  const [topic, setTopic] = useState("");
  const [drafts, setDrafts] = useState<GeneratedPost[]>([]);
  const [pending, start] = useTransition();

  function generate() {
    start(async () => {
      const result = await draftPosts({
        businessName,
        industry,
        platform,
        pillar,
        topic,
      });
      setDrafts(result);
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Platform
            </p>
            <Pills
              options={PLATFORMS}
              value={platform}
              onChange={setPlatform}
              labels={PLATFORM_LABEL}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Content pillar
            </p>
            <Pills options={PILLARS} value={pillar} onChange={setPillar} />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              What's the post about?
            </p>
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={2}
              placeholder="e.g. our new Saturday appointments, or a tip about post-run recovery"
              className="text-sm"
            />
          </div>

          <Button onClick={generate} disabled={pending || !topic.trim()}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate posts
          </Button>
        </CardContent>
      </Card>

      {drafts.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-sm font-medium text-ink">
            {drafts.length} drafts for {PLATFORM_LABEL[platform]} — edit, then
            save or schedule
          </p>
          {drafts.map((d, i) => (
            <DraftCard
              key={i}
              draft={d}
              platform={platform}
              pillar={pillar}
              topic={topic}
            />
          ))}
        </div>
      )}
    </div>
  );
}
