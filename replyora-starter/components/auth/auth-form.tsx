"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { USE_SUPABASE, APP_URL } from "@/lib/data/mode";
import { PLANS } from "@/lib/stripe/plans";
import {
  TRIALABLE_PLANS,
  normalizePlanSlug,
  PLAN_INTENT_COOKIE,
} from "@/lib/plan-intent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/data/types";

/**
 * Auth form.
 * LIVE: real Supabase — email/password + Google OAuth (redirects via
 * NEXT_PUBLIC_APP_URL/auth/callback). On first login the handle_new_user trigger
 * provisions the workspace + owner + assistant + usage.
 * MOCK (local dev, no Supabase env): routes straight into the app.
 */
export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [plan, setPlan] = useState<Plan>("growth");
  const isSignup = mode === "signup";
  const redirectTo = `${APP_URL.replace(/\/$/, "")}/auth/callback`;

  // Surface any callback error (?error=...) and pre-select the plan (?plan=...).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) setError(err === "auth" ? "Sign-in failed. Please try again." : err);
    const chosen = normalizePlanSlug(params.get("plan"));
    if (chosen) setPlan(chosen);
  }, []);

  /** Persist the chosen trial plan so it survives the OAuth round-trip. */
  function rememberPlan() {
    document.cookie = `${PLAN_INTENT_COOKIE}=${plan}; path=/; max-age=3600; samesite=lax`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    // Local dev without Supabase: keep the fast mock flow.
    if (!USE_SUPABASE) {
      setTimeout(
        () => router.push(isSignup ? "/onboarding" : "/dashboard"),
        500,
      );
      return;
    }

    const supabase = createClient();

    if (isSignup) {
      rememberPlan();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: { full_name: name || email.split("@")[0], intended_plan: plan },
        },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      // If email confirmation is on, there's no session yet.
      if (!data.session) {
        setNotice("Check your email to confirm your account, then log in.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function signInWithGoogle() {
    setError(null);
    setLoading(true);
    if (!USE_SUPABASE) {
      setTimeout(() => router.push("/dashboard"), 500);
      return;
    }
    if (isSignup) rememberPlan();
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // On success the browser is redirected to Google, then back to /auth/callback.
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl text-oxblood">
          {isSignup ? "Start your 7-day free trial" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isSignup
            ? `No card to start. After 7 days, ${PLANS[plan].name} is $${PLANS[plan].priceAud}/mo + a one-time $250 setup fee.`
            : "Log in to your Replyora workspace."}
        </p>
      </div>

      {isSignup && (
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/60">
            Choose the plan to trial
          </p>
          <div className="grid grid-cols-3 gap-2">
            {TRIALABLE_PLANS.map((p) => {
              const cfg = PLANS[p];
              const active = plan === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlan(p)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-center transition-colors",
                    active
                      ? "border-oxblood bg-oxblood text-cream"
                      : "border-border bg-card text-ink hover:bg-oat",
                  )}
                >
                  <span className="block text-sm font-semibold">{cfg.name}</span>
                  <span
                    className={cn(
                      "block text-xs",
                      active ? "text-cream/80" : "text-muted-foreground",
                    )}
                  >
                    ${cfg.priceAud}/mo
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Free for 7 days · switch or cancel anytime
          </p>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={signInWithGoogle}
        disabled={loading}
      >
        <GoogleIcon />
        Continue with Google
      </Button>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          or
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p className="mb-4 rounded-lg border border-rose/30 bg-oat/60 px-3 py-2 text-sm text-wine">
          {notice}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignup && (
          <div className="space-y-1.5">
            <Label htmlFor="name">Business name</Label>
            <Input
              id="name"
              placeholder="Your business"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@business.com.au"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSignup ? "Create workspace" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isSignup ? "Already have an account? " : "New to Replyora? "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-medium text-oxblood hover:underline"
        >
          {isSignup ? "Log in" : "Create one free"}
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
