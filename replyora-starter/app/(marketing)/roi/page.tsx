"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Reveal, Magnetic } from "@/components/marketing/motion";

function currency(n: number): string {
  return n.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });
}

export default function RoiPage() {
  const [enquiries, setEnquiries] = useState(120);
  const [afterHoursPct, setAfterHoursPct] = useState(40);
  const [value, setValue] = useState(180);
  const [captureLift, setCaptureLift] = useState(30);

  const afterHours = Math.round((enquiries * afterHoursPct) / 100);
  const recovered = Math.round((afterHours * captureLift) / 100);
  const monthly = recovered * value;
  const yearly = monthly * 12;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Reveal className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-rose">
          ROI calculator
        </p>
        <h1 className="mt-3 font-display text-4xl text-oxblood">
          What are slow replies costing you?
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Estimate the revenue you're leaving on the table when enquiries go
          unanswered — especially after hours.
        </p>
      </Reveal>

      <Reveal className="mt-12 grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-5 p-6">
            <Field
              id="enq"
              label="Website enquiries per month"
              value={enquiries}
              onChange={setEnquiries}
            />
            <Field
              id="ah"
              label="% that arrive after hours"
              value={afterHoursPct}
              onChange={setAfterHoursPct}
              suffix="%"
            />
            <Field
              id="val"
              label="Average customer value (AUD)"
              value={value}
              onChange={setValue}
              prefix="$"
            />
            <Field
              id="lift"
              label="Extra enquiries Replyora captures"
              value={captureLift}
              onChange={setCaptureLift}
              suffix="%"
            />
          </CardContent>
        </Card>

        <div className="flex flex-col justify-center rounded-2xl bg-oxblood p-8 text-cream">
          <p className="text-sm uppercase tracking-widest text-cream/70">
            Estimated recovered revenue
          </p>
          <p className="mt-2 font-display text-5xl">{currency(monthly)}</p>
          <p className="text-sm text-cream/80">per month</p>
          <div className="my-6 h-px bg-cream/20" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-display text-2xl">{afterHours}</p>
              <p className="text-cream/70">after-hours / mo</p>
            </div>
            <div>
              <p className="font-display text-2xl">{recovered}</p>
              <p className="text-cream/70">recovered / mo</p>
            </div>
          </div>
          <p className="mt-6 text-lg">
            <span className="font-display text-3xl">{currency(yearly)}</span>
            <span className="text-cream/80"> / year</span>
          </p>
          <Magnetic strength={0.3}>
            <Button
              asChild
              className="mt-6 bg-cream text-oxblood hover:bg-cream/90"
            >
              <Link href="/signup">
                Start capturing it
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Magnetic>
        </div>
      </Reveal>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Estimates only — actual results depend on your traffic and offering.
      </p>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  prefix,
  suffix,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}
        <Input
          id={id}
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
        />
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}
