"use client";

import { useMemo, useState } from "react";
import { Download, Mail, Phone } from "lucide-react";

import { updateLeadStatus } from "@/lib/data/actions";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LeadScoreBadge,
  LeadStatusBadge,
} from "@/components/dashboard/status-badges";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { Lead, LeadStatus } from "@/lib/data/types";

const FILTERS: { key: LeadStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "qualified", label: "Qualified" },
  { key: "booked", label: "Booked" },
  { key: "lost", label: "Lost" },
];

const STATUSES: LeadStatus[] = ["new", "qualified", "booked", "lost"];

export function LeadsTable({
  initialLeads,
  initialFilter = "all",
}: {
  initialLeads: Lead[];
  initialFilter?: LeadStatus | "all";
}) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [filter, setFilter] = useState<LeadStatus | "all">(initialFilter);

  const visible = useMemo(() => {
    const list =
      filter === "all" ? leads : leads.filter((l) => l.status === filter);
    // Hottest leads first so owners act on revenue.
    return [...list].sort((a, b) => b.scoreValue - a.scoreValue);
  }, [leads, filter]);

  async function changeStatus(id: string, status: LeadStatus) {
    const lead = leads.find((l) => l.id === id);
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l)),
    );
    // // TODO: replace with Supabase update.
    await updateLeadStatus(id, status);
    if (status === "booked" && lead) {
      toast({
        title: "Lead booked 🎉",
        body: `${lead.name} moved to booked`,
        type: "booking",
      });
    }
  }

  function exportCsv() {
    const header = ["Name", "Email", "Phone", "Intent", "Status", "Created"];
    const rows = leads.map((l) => [
      l.name,
      l.email,
      l.phone,
      l.intent,
      l.status,
      l.createdAt,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "replyora-leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const count =
              f.key === "all"
                ? leads.length
                : leads.filter((l) => l.status === f.key).length;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  filter === f.key
                    ? "border-oxblood bg-oxblood text-cream"
                    : "border-border bg-card text-ink/70 hover:bg-oat",
                )}
              >
                {f.label}
                <span className="ml-1.5 opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Intent &amp; qualification</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((l) => {
                const q = l.qualification;
                const chips = [q.service, q.urgency, q.suburb, q.budget].filter(
                  Boolean,
                ) as string[];
                return (
                  <TableRow key={l.id}>
                    <TableCell className="align-top">
                      <p className="font-medium text-ink">{l.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(l.createdAt)}
                      </p>
                    </TableCell>
                    <TableCell className="align-top">
                      <LeadScoreBadge score={l.score} value={l.scoreValue} />
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <a
                          href={`mailto:${l.email}`}
                          className="flex items-center gap-1.5 hover:text-oxblood"
                        >
                          <Mail className="h-3 w-3" />
                          {l.email}
                        </a>
                        {l.phone && (
                          <a
                            href={`tel:${l.phone}`}
                            className="flex items-center gap-1.5 hover:text-oxblood"
                          >
                            <Phone className="h-3 w-3" />
                            {l.phone}
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[260px] align-top">
                      <p className="text-sm text-ink/80">{l.intent}</p>
                      {chips.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {chips.map((c) => (
                            <span
                              key={c}
                              className="rounded-full bg-oat px-2 py-0.5 text-[11px] text-wine"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      <LeadStatusBadge status={l.status} />
                    </TableCell>
                    <TableCell className="text-right align-top">
                      <Select
                        value={l.status}
                        onValueChange={(v) =>
                          changeStatus(l.id, v as LeadStatus)
                        }
                      >
                        <SelectTrigger className="ml-auto h-8 w-[130px] capitalize">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem
                              key={s}
                              value={s}
                              className="capitalize"
                            >
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
              {visible.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No leads in this view.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
