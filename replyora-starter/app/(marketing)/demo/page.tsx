"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateSlots } from "@/lib/booking-slots";
import { DEMO_BUSINESS_PROFILE } from "@/lib/data/seed";
import { CONTACT_EMAIL } from "@/lib/site";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/marketing/motion";
import type { TimeSlot } from "@/lib/data/types";

const BENEFITS = [
  "A 20-minute walkthrough tailored to your business",
  "See lead capture, booking and qualification live",
  "Get a template pre-filled for your industry",
];

export default function DemoPage() {
  const [sent, setSent] = useState(false);
  const [slot, setSlot] = useState<TimeSlot | null>(null);
  // Native scheduling from business hours. // TODO: Calendly/Google Calendar seam.
  const slots = useMemo(
    () => generateSlots(DEMO_BUSINESS_PROFILE.hours, new Date(), 7, 3).slice(0, 9),
    [],
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="grid gap-10 md:grid-cols-2">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest text-rose">
            Book a demo
          </p>
          <h1 className="mt-3 font-display text-4xl text-oxblood">
            See Replyora on your business
          </h1>
          <p className="mt-4 text-muted-foreground">
            Pick a time and we&apos;ll show you exactly how it would answer your
            customers and book your appointments.
          </p>
          <ul className="mt-6 space-y-3">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-ink/80">
                <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-rose" />
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">
            Prefer email? Reach us at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-oxblood hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Reveal>

        <Card>
          <CardContent className="p-6">
            {sent ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-oxblood text-cream">
                  <Check className="h-6 w-6" />
                </div>
                <h2 className="font-display text-xl text-oxblood">
                  You&apos;re booked in!
                </h2>
                <p className="text-sm text-muted-foreground">
                  {slot
                    ? `We'll see you ${slot.label}. A calendar invite is on its way.`
                    : "We'll be in touch to confirm a time."}
                </p>
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                  track("demo_booked", { slot: slot?.label ?? "unspecified" });
                }}
              >
                <div className="space-y-2">
                  <Label>Pick a time</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {slots.map((s) => (
                      <button
                        key={s.start}
                        type="button"
                        onClick={() => setSlot(s)}
                        className={cn(
                          "rounded-lg border px-2 py-2 text-xs transition-colors",
                          slot?.start === s.start
                            ? "border-oxblood bg-oxblood text-cream"
                            : "border-border bg-card text-ink hover:bg-oat",
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="d-name">Your name</Label>
                  <Input id="d-name" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="d-email">Work email</Label>
                  <Input id="d-email" type="email" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="d-biz">Business name</Label>
                  <Input id="d-biz" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="d-notes">What would you like to see?</Label>
                  <Textarea id="d-notes" rows={2} />
                </div>
                <Button type="submit" className="w-full" disabled={!slot}>
                  {slot ? `Confirm ${slot.label}` : "Select a time above"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Prototype scheduling — native slots now, Calendly/Google seam later.
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
