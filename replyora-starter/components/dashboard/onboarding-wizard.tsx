"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { saveOnboarding, markOnboarded } from "@/lib/data/onboarding";
import { toast } from "@/lib/toast";
import { NICHE_TEMPLATES } from "@/lib/data/seed";
import type { NicheTemplate } from "@/lib/data/types";

const STEP_LABELS = ["Template", "Business", "Knowledge", "Assistant", "Finish"];

export function OnboardingWizard() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [step, setStep] = useState(0);
  const [template, setTemplate] = useState<NicheTemplate | null>(null);

  const [bizName, setBizName] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");
  const [knowledge, setKnowledge] = useState<string[]>([]);
  const [kbDraft, setKbDraft] = useState("");
  const [assistantName, setAssistantName] = useState("");
  const [welcome, setWelcome] = useState("");

  function applyTemplate(t: NicheTemplate | null) {
    setTemplate(t);
    if (t) {
      setIndustry(t.industry);
      setDescription(t.blurb);
      setKnowledge(t.knowledge.map((k) => k.title));
      setAssistantName(t.persona.name);
      setWelcome(t.persona.welcome);
    } else {
      setAssistantName("Assistant");
      setWelcome("Hi! 👋 How can I help you today?");
    }
    setStep(1);
  }

  function finish() {
    start(async () => {
      await saveOnboarding({
        businessName: bizName,
        industry,
        description,
        assistantName,
        welcomeMessage: welcome,
        knowledge,
      });
      toast({ title: "Your assistant is set up!", type: "success" });
      router.push("/dashboard");
      router.refresh();
    });
  }

  function skip() {
    start(async () => {
      await markOnboarded();
      router.push("/dashboard");
      router.refresh();
    });
  }

  const canNext =
    step === 1 ? bizName.trim().length > 0 : step === 3 ? assistantName.trim().length > 0 : true;

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <Logo height={30} href="/dashboard" />
        <button
          type="button"
          onClick={skip}
          disabled={pending}
          className="text-sm text-muted-foreground hover:text-oxblood disabled:opacity-50"
        >
          Skip for now
        </button>
      </div>

      {/* Progress */}
      <div className="mb-8 flex items-center gap-2">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                i < step
                  ? "bg-oxblood text-cream"
                  : i === step
                    ? "border-2 border-oxblood text-oxblood"
                    : "border border-border text-muted-foreground",
              )}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 rounded",
                  i < step ? "bg-oxblood" : "bg-border",
                )}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex-1">
        {step === 0 && (
          <div>
            <h1 className="font-display text-3xl text-oxblood">
              What kind of business is this?
            </h1>
            <p className="mt-2 text-muted-foreground">
              Pick a template to pre-fill your assistant, or start from scratch.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {NICHE_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-oxblood hover:bg-oat/40"
                >
                  <span className="text-2xl">{t.emoji}</span>
                  <div>
                    <p className="font-medium text-ink">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.blurb}</p>
                  </div>
                </button>
              ))}
              <button
                type="button"
                onClick={() => applyTemplate(null)}
                className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card p-4 text-left transition-colors hover:border-oxblood sm:col-span-2"
              >
                <Sparkles className="h-5 w-5 text-oxblood" />
                <span className="font-medium text-ink">Start from scratch</span>
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <StepShell
            title="Tell us about your business"
            subtitle="Just the basics — you can add more later."
          >
            <div className="space-y-1.5">
              <Label htmlFor="w-name">Business name</Label>
              <Input
                id="w-name"
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                placeholder="Your business name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-industry">Industry</Label>
              <Input
                id="w-industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Dental clinic, Plumbing, Real estate"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-desc">What do you do? (one or two lines)</Label>
              <Textarea
                id="w-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What your business offers — the assistant uses this to answer visitors."
              />
            </div>
          </StepShell>
        )}

        {step === 2 && (
          <StepShell
            title="Add some knowledge"
            subtitle="What should your assistant know? We pre-filled a few starters."
          >
            <div className="space-y-2">
              {knowledge.map((k, i) => (
                <div
                  key={`${k}-${i}`}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm text-ink"
                >
                  {k}
                  <button
                    type="button"
                    onClick={() =>
                      setKnowledge((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className="text-muted-foreground hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={kbDraft}
                onChange={(e) => setKbDraft(e.target.value)}
                placeholder="Add a topic (e.g. Pricing)"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (kbDraft.trim()) {
                    setKnowledge((p) => [...p, kbDraft.trim()]);
                    setKbDraft("");
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </StepShell>
        )}

        {step === 3 && (
          <StepShell
            title="Customise your assistant"
            subtitle="Give it a name and a welcome message."
          >
            <div className="space-y-1.5">
              <Label htmlFor="w-aname">Assistant name</Label>
              <Input
                id="w-aname"
                value={assistantName}
                onChange={(e) => setAssistantName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-welcome">Welcome message</Label>
              <Textarea
                id="w-welcome"
                rows={3}
                value={welcome}
                onChange={(e) => setWelcome(e.target.value)}
              />
            </div>
          </StepShell>
        )}

        {step === 4 && (
          <StepShell
            title="You're ready to go live 🎉"
            subtitle="We'll save everything to your workspace. Grab your one-line install snippet from the Install page whenever you're ready to add it to your site."
          >
            <ul className="space-y-2 text-sm text-ink/80">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-oxblood" /> Business:{" "}
                {bizName || "—"}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-oxblood" /> Assistant:{" "}
                {assistantName || "Assistant"}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-oxblood" /> {knowledge.length}{" "}
                knowledge item{knowledge.length === 1 ? "" : "s"}
              </li>
            </ul>
          </StepShell>
        )}
      </div>

      {/* Nav */}
      {step > 0 && (
        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          {step < 4 ? (
            <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={finish} disabled={pending}>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Finish &amp; go to dashboard
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="font-display text-3xl text-oxblood">{title}</h1>
      <p className="mt-2 text-muted-foreground">{subtitle}</p>
      <Card className="mt-6">
        <CardContent className="space-y-4 p-6">{children}</CardContent>
      </Card>
    </div>
  );
}
