"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import type { FollowupRule, LeadStatus } from "@/lib/data/types";

const STATUSES: LeadStatus[] = ["new", "qualified"];

export function AutomationTab({ rule: initial }: { rule: FollowupRule }) {
  const [rule, setRule] = useState(initial);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof FollowupRule>(key: K, value: FollowupRule[K]) {
    setRule((r) => ({ ...r, [key]: value }));
    setSaved(false);
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Follow-up automation</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Automatically nudge leads that go quiet so none slip through.
          </p>
        </div>
        <Switch
          checked={rule.enabled}
          onCheckedChange={(v) => set("enabled", v)}
        />
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fu-status">Trigger when a lead stays</Label>
            <Select
              value={rule.targetStatus}
              onValueChange={(v) => set("targetStatus", v as LeadStatus)}
            >
              <SelectTrigger id="fu-status" className="capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fu-delay">…for longer than (hours)</Label>
            <Input
              id="fu-delay"
              type="number"
              min={1}
              value={rule.delayHours}
              onChange={(e) => set("delayHours", Number(e.target.value))}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fu-msg">Follow-up message</Label>
          <Textarea
            id="fu-msg"
            rows={4}
            value={rule.message}
            onChange={(e) => set("message", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Use <code className="rounded bg-oat px-1">{"{name}"}</code> and{" "}
            <code className="rounded bg-oat px-1">{"{service}"}</code> to
            personalise.
          </p>
        </div>
        <Button
          onClick={() => {
            setSaved(true);
            toast({ title: "Automation saved", type: "success" });
          }}
        >
          {saved && <Check className="h-4 w-4" />}
          {saved ? "Saved" : "Save automation"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Sending is stubbed. // TODO: scheduled job (cron/queue) + email/SMS send.
        </p>
      </CardContent>
    </Card>
  );
}
