"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ROLES = [
  "Agency",
  "Social media manager",
  "Freelancer",
  "Business owner",
  "Something else",
];

/**
 * Waitlist capture for the closed beta.
 *
 * Deliberately short: name, email, and one optional tap to say what they do.
 * Every extra field on a waitlist costs signups, and the only thing actually
 * REQUIRED to invite someone later is a working email address.
 */
export function WaitlistForm({ source = "beta" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          role,
          website,
          source,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Couldn't reach us just then. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div
        className="rounded-2xl border border-ink/10 bg-white p-8 text-center"
        role="status"
      >
        <h2 className="font-display text-2xl text-wine">You&apos;re on the list.</h2>
        <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-ink/75">
          We&apos;re letting in 50 people to start. If you&apos;re a fit
          you&apos;ll get a personal invite link by email — no queue-jumping, no
          drip campaign.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="wl-name">
          <input
            id="wl-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className={INPUT}
            placeholder="Sam Rivers"
          />
        </Field>
        <Field label="Email" htmlFor="wl-email" required>
          <input
            id="wl-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className={INPUT}
            placeholder="sam@studio.com.au"
          />
        </Field>
      </div>


      <Field label="What do you do? (optional)" htmlFor="wl-role">
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <Chip key={r} active={role === r} onClick={() => setRole(r)}>
              {r}
            </Chip>
          ))}
        </div>
      </Field>



      {error && (
        <p role="alert" className="text-[13px] font-medium text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full rounded-full sm:w-auto">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          "Request beta access →"
        )}
      </Button>
      <p className="text-[12px] leading-relaxed text-ink/60">
        No card, no spam. We&apos;ll only email you about your invite.
      </p>
    </form>
  );
}

const INPUT =
  "w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink/40 focus:border-ink/50";

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/75"
      >
        {label}
        {required && <span className="ml-1 text-roseink">*</span>}
      </label>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
        active
          ? "border-ink bg-ink text-porcelain"
          : "border-ink/20 text-ink/75 hover:border-ink/50 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
