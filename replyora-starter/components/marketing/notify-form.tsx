"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

/**
 * "Notify me" waitlist capture for a roadmap feature. Posts to /api/waitlist.
 * Used on the /roadmap page (and reusable in the dashboard).
 */
export function NotifyForm({
  feature = "voice",
  source = "roadmap",
  className,
}: {
  feature?: string;
  source?: string;
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setMessage("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, feature, source }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setState("error");
        setMessage(data.error ?? "Something went wrong.");
        return;
      }
      track("waitlist_signup", { feature, source });
      setState("done");
    } catch {
      setState("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  if (state === "done") {
    return (
      <p
        className={`inline-flex items-center gap-2 rounded-lg bg-oat/70 px-4 py-3 text-sm text-wine ${className ?? ""}`}
      >
        <Check className="h-4 w-4" />
        Thanks — we&apos;ll email you the moment it goes live.
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`flex w-full max-w-md flex-col gap-2 sm:flex-row ${className ?? ""}`}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@yourbusiness.com.au"
        aria-label="Email address"
        className="flex-1 rounded-md border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-oxblood focus:outline-none"
      />
      <Button type="submit" disabled={state === "loading"}>
        {state === "loading" ? "…" : "Notify me"}
      </Button>
      {state === "error" && (
        <span className="text-xs text-rose-600 sm:hidden">{message}</span>
      )}
    </form>
  );
}
