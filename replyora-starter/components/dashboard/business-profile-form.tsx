"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { updateBusinessProfile } from "@/lib/data/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { BusinessProfile } from "@/lib/data/types";

const DAYS: { key: string; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

const TIMEZONES = [
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Adelaide",
  "Australia/Perth",
  "Pacific/Auckland",
];

export function BusinessProfileForm({ profile }: { profile: BusinessProfile }) {
  const [form, setForm] = useState<BusinessProfile>(profile);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  function set<K extends keyof BusinessProfile>(
    key: K,
    value: BusinessProfile[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
    setStatus("idle");
  }

  function setHours(day: string, patch: Partial<{ open: string; close: string; closed: boolean }>) {
    setForm((f) => ({
      ...f,
      hours: {
        ...f.hours,
        [day]: { ...f.hours[day], ...patch } as BusinessProfile["hours"][string],
      },
    }));
    setStatus("idle");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    // // TODO: replace with Supabase update.
    await updateBusinessProfile(form);
    setStatus("saved");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field label="Industry" id="industry">
            <Input
              id="industry"
              value={form.industry}
              onChange={(e) => set("industry", e.target.value)}
            />
          </Field>
          <Field label="Website" id="website">
            <Input
              id="website"
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
            />
          </Field>
          <Field label="Description" id="description" className="sm:col-span-2">
            <Textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Used in the assistant&apos;s system prompt to ground answers.
            </p>
          </Field>
          <Field label="Phone" id="phone">
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>
          <Field label="Email" id="email">
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label="Address" id="address" className="sm:col-span-2">
            <Input
              id="address"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </Field>
          <Field label="Timezone" id="timezone">
            <Select
              value={form.timezone}
              onValueChange={(v) => set("timezone", v)}
            >
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Opening hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {DAYS.map((d) => {
            const h = form.hours[d.key] ?? { open: "", close: "" };
            const closed = h.closed ?? false;
            return (
              <div
                key={d.key}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2"
              >
                <span className="w-24 text-sm font-medium text-ink">
                  {d.label}
                </span>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!closed}
                    onCheckedChange={(v) => setHours(d.key, { closed: !v })}
                  />
                  <span className="text-xs text-muted-foreground">
                    {closed ? "Closed" : "Open"}
                  </span>
                </div>
                {!closed && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={h.open}
                      onChange={(e) => setHours(d.key, { open: e.target.value })}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">–</span>
                    <Input
                      type="time"
                      value={h.close}
                      onChange={(e) =>
                        setHours(d.key, { close: e.target.value })
                      }
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
          {status === "saved" && <Check className="h-4 w-4" />}
          {status === "saved" ? "Saved" : "Save changes"}
        </Button>
        {status === "saved" && (
          <span className="text-sm text-muted-foreground">
            Profile updated (mock — not persisted across reload).
          </span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  id,
  className,
  children,
}: {
  label: string;
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
