import { Flame, Snowflake, ThermometerSun } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  ConversationStatus,
  KnowledgeStatus,
  LeadScore,
  LeadStatus,
} from "@/lib/data/types";

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "danger"
  | "muted";

const LEAD: Record<LeadStatus, { label: string; variant: BadgeVariant }> = {
  new: { label: "New", variant: "default" },
  qualified: { label: "Qualified", variant: "warning" },
  booked: { label: "Booked", variant: "success" },
  lost: { label: "Lost", variant: "muted" },
};

const KNOWLEDGE: Record<
  KnowledgeStatus,
  { label: string; variant: BadgeVariant }
> = {
  pending: { label: "Pending", variant: "muted" },
  processing: { label: "Processing", variant: "warning" },
  ready: { label: "Ready", variant: "success" },
  failed: { label: "Failed", variant: "danger" },
};

const CONVERSATION: Record<
  ConversationStatus,
  { label: string; variant: BadgeVariant }
> = {
  open: { label: "Open", variant: "warning" },
  closed: { label: "Closed", variant: "muted" },
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const s = LEAD[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export function KnowledgeStatusBadge({ status }: { status: KnowledgeStatus }) {
  const s = KNOWLEDGE[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export function ConversationStatusBadge({
  status,
}: {
  status: ConversationStatus;
}) {
  const s = CONVERSATION[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

const SCORE: Record<
  LeadScore,
  { label: string; icon: typeof Flame; className: string }
> = {
  hot: { label: "Hot", icon: Flame, className: "bg-red-100 text-red-700" },
  warm: {
    label: "Warm",
    icon: ThermometerSun,
    className: "bg-amber-100 text-amber-800",
  },
  cold: {
    label: "Cold",
    icon: Snowflake,
    className: "bg-sky-100 text-sky-700",
  },
};

export function LeadScoreBadge({
  score,
  value,
}: {
  score: LeadScore;
  value?: number;
}) {
  const s = SCORE[score];
  const Icon = s.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        s.className,
      )}
    >
      <Icon className="h-3 w-3" />
      {s.label}
      {value !== undefined && <span className="opacity-70">· {value}</span>}
    </span>
  );
}
