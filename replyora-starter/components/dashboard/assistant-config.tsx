"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, Plus, X } from "lucide-react";

import { updateAssistant } from "@/lib/data/actions";
import { generateSlots } from "@/lib/booking-slots";
import { DEMO_BUSINESS_PROFILE } from "@/lib/data/seed";
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
import { Chat } from "@/components/widget/chat";
import { cn } from "@/lib/utils";
import type { Assistant } from "@/lib/data/types";

const TONES: Assistant["tone"][] = [
  "friendly",
  "professional",
  "playful",
  "concise",
];

const SWATCHES = [
  "#5C1A1A",
  "#3F1011",
  "#B26B62",
  "#1F4E46",
  "#2D3A66",
  "#7A3E1D",
  "#111827",
];

export function AssistantConfig({
  assistant,
  businessName,
  canRemoveBranding = false,
}: {
  assistant: Assistant;
  businessName: string;
  canRemoveBranding?: boolean;
}) {
  const [config, setConfig] = useState<Assistant>(assistant);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const bookingSlots = useMemo(
    () => generateSlots(DEMO_BUSINESS_PROFILE.hours),
    [],
  );

  function set<K extends keyof Assistant>(key: K, value: Assistant[K]) {
    setConfig((c) => ({ ...c, [key]: value }));
    setStatus("idle");
  }

  async function handleSave() {
    setStatus("saving");
    // // TODO: replace with Supabase update.
    await updateAssistant(config);
    setStatus("saved");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Config */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Persona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="a-name">Assistant name</Label>
              <Input
                id="a-name"
                value={config.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-tone">Tone</Label>
              <Select
                value={config.tone}
                onValueChange={(v) => set("tone", v as Assistant["tone"])}
              >
                <SelectTrigger id="a-tone" className="capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-welcome">Welcome message</Label>
              <Textarea
                id="a-welcome"
                rows={3}
                value={config.welcomeMessage}
                onChange={(e) => set("welcomeMessage", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label>Brand colour</Label>
            <div className="flex flex-wrap items-center gap-2">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("brandColor", c)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-transform",
                    config.brandColor.toLowerCase() === c.toLowerCase()
                      ? "scale-110 border-ink"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Use ${c}`}
                />
              ))}
              <Input
                value={config.brandColor}
                onChange={(e) => set("brandColor", e.target.value)}
                className="w-28 font-mono text-xs uppercase"
              />
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <div>
                <Label>Remove &ldquo;Powered by Replyora&rdquo;</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {canRemoveBranding
                    ? "White-label the widget with your own brand."
                    : "White-labelling is available on Growth and Pro."}
                </p>
              </div>
              <Switch
                checked={Boolean(config.removeBranding)}
                disabled={!canRemoveBranding}
                onCheckedChange={(v) => set("removeBranding", v)}
                aria-label="Remove Replyora branding"
              />
            </div>
          </CardContent>
        </Card>

        <SuggestedQuestions
          values={config.suggestedQuestions}
          onChange={(v) => set("suggestedQuestions", v)}
        />

        <LeadFieldsEditor
          fields={config.leadFields}
          onChange={(v) => set("leadFields", v)}
        />

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={status === "saving"}>
            {status === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
            {status === "saved" && <Check className="h-4 w-4" />}
            {status === "saved" ? "Saved" : "Save assistant"}
          </Button>
          {status === "saved" && (
            <span className="text-sm text-muted-foreground">
              Saved (mock — not persisted across reload).
            </span>
          )}
        </div>
      </div>

      {/* Live preview */}
      <div>
        <div className="sticky top-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-ink">Live preview</p>
            <span className="text-xs text-muted-foreground">
              Updates as you edit
            </span>
          </div>
          <div className="h-[560px] overflow-hidden rounded-2xl border border-border shadow-lg">
            <Chat
              config={{
                publicKey: config.publicKey,
                name: config.name,
                welcomeMessage: config.welcomeMessage,
                suggestedQuestions: config.suggestedQuestions,
                brandColor: config.brandColor,
                leadFields: config.leadFields,
                businessName,
                showBranding: !(canRemoveBranding && config.removeBranding),
                bookingSlots,
              }}
            />
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Try it — replies stream from the mock knowledge base.
          </p>
        </div>
      </div>
    </div>
  );
}

function SuggestedQuestions({
  values,
  onChange,
}: {
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Suggested questions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {values.map((q, i) => (
            <div
              key={`${q}-${i}`}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm"
            >
              <span className="flex-1 text-ink">{q}</span>
              <button
                type="button"
                onClick={() => onChange(values.filter((_, idx) => idx !== i))}
                className="text-muted-foreground hover:text-red-600"
                aria-label="Remove"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a starter question…"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (draft.trim()) {
                  onChange([...values, draft.trim()]);
                  setDraft("");
                }
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (draft.trim()) {
                onChange([...values, draft.trim()]);
                setDraft("");
              }
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LeadFieldsEditor({
  fields,
  onChange,
}: {
  fields: Assistant["leadFields"];
  onChange: (v: Assistant["leadFields"]) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lead capture fields</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {fields.map((f, i) => (
          <div
            key={f.key}
            className="flex items-center gap-3 rounded-md border border-border px-3 py-2"
          >
            <span className="flex-1 text-sm font-medium text-ink">
              {f.label}
            </span>
            <span className="text-xs text-muted-foreground">Required</span>
            <Switch
              checked={f.required}
              onCheckedChange={(v) =>
                onChange(
                  fields.map((field, idx) =>
                    idx === i ? { ...field, required: v } : field,
                  ),
                )
              }
            />
          </div>
        ))}
        <p className="pt-1 text-xs text-muted-foreground">
          The assistant collects these when a visitor shows buying intent.
        </p>
      </CardContent>
    </Card>
  );
}
