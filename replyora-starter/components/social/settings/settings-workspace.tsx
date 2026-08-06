"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type {
  WorkspaceBilling,
  SocialPlan,
  SocialAddons,
  BillingInterval,
} from "@/lib/social/plans";
import { SOCIAL_PLAN_PRICE } from "@/lib/social/plans";
import {
  saveAddonsAction,
  saveProfileNameAction,
  saveWorkspaceBillingAction,
  saveNewsletterOptInAction,
  requestDeletionAction,
} from "@/app/(social)/settings/actions";
import { GuideTrigger } from "@/components/social/guide";
import { toast } from "@/lib/toast";

const TABS = ["Profile", "Preferences", "Integrations", "Billing", "Workspace", "Data"] as const;
type Tab = (typeof TABS)[number];

const inp =
  "w-full rounded-lg border border-oxblood/20 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood";

export function SettingsWorkspace({
  fullName,
  email,
  newsletterOptIn,
  billing,
  currentPlan,
  planStatus,
  stripeReady,
  initialTab,
}: {
  fullName: string;
  email: string;
  newsletterOptIn: boolean;
  billing: WorkspaceBilling;
  currentPlan: SocialPlan;
  planStatus: string;
  stripeReady: boolean;
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab ?? "Profile");

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/85">
          <span className="text-oxblood">( 04 )</span> Settings
          <GuideTrigger pageKey="settings" />
        </div>
      </div>

      <div className="flex flex-wrap gap-5 border-b border-ink/10 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em]">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={
              t === tab
                ? "pb-1 text-oxblood underline decoration-oxblood underline-offset-[7px]"
                : "pb-1 text-ink/80 hover:text-oxblood"
            }
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-8 max-w-2xl">
        {tab === "Profile" && <ProfileTab fullName={fullName} email={email} />}
        {tab === "Workspace" && <WorkspaceTab billing={billing} />}
        {tab === "Billing" && (
          <BillingTab currentPlan={currentPlan} planStatus={planStatus} stripeReady={stripeReady} addons={billing.addons} />
        )}
        {tab === "Preferences" && <PreferencesTab optIn={newsletterOptIn} email={email} />}
        {tab === "Integrations" && (
          <Placeholder text="Connect Instagram & TikTok per client under each client's Integrations tab." />
        )}
        {tab === "Data" && <DataTab />}
      </div>
    </div>
  );
}

function ProfileTab({ fullName, email }: { fullName: string; email: string }) {
  const router = useRouter();
  const [name, setName] = useState(fullName);
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <Card title="Profile">
        <Field label="Full name"><input value={name} onChange={(e) => setName(e.target.value)} className={inp} /></Field>
        <Field label="Phone"><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" className={inp} /></Field>
        <button
          type="button"
          onClick={() =>
            startTransition(async () => {
              await saveProfileNameAction(name);
              setStatus("saved");
              setTimeout(() => setStatus("idle"), 1600);
              router.refresh();
            })
          }
          className="rounded-full bg-oxblood px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90"
        >
          {status === "saved" ? "Saved ✓" : "Save changes"}
        </button>
      </Card>

      <Card title="Email">
        <p className="text-sm text-ink/80">{email}</p>
        <button type="button" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-oxblood hover:underline">
          Change email
        </button>
      </Card>

      <Card title="Password">
        <p className="text-sm text-ink/85">••••••••</p>
        <button type="button" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-oxblood hover:underline">
          Change password
        </button>
      </Card>
    </div>
  );
}

function WorkspaceTab({ billing }: { billing: WorkspaceBilling }) {
  const router = useRouter();
  const [b, setB] = useState(billing);
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const [, startTransition] = useTransition();

  function set<K extends keyof WorkspaceBilling>(k: K, v: WorkspaceBilling[K]) {
    setB((prev) => ({ ...prev, [k]: v }));
  }
  function setAddr(k: keyof WorkspaceBilling["address"], v: string) {
    setB((prev) => ({ ...prev, address: { ...prev.address, [k]: v } }));
  }

  return (
    <Card title="Workspace">
      <p className="-mt-2 text-[12px] text-ink/85">
        How your studio appears across ReplyOra — client portals, invoices and reports.
      </p>
      <Field label="Business name"><input value={b.businessName} onChange={(e) => set("businessName", e.target.value)} className={inp} /></Field>
      <Field label="Business logo URL"><input value={b.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} placeholder="https://…" className={inp} /></Field>
      <Field label="Report title"><input value={b.reportTitle} onChange={(e) => set("reportTitle", e.target.value)} className={inp} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Business email"><input value={b.businessEmail} onChange={(e) => set("businessEmail", e.target.value)} className={inp} /></Field>
        <Field label="Business phone"><input value={b.businessPhone} onChange={(e) => set("businessPhone", e.target.value)} className={inp} /></Field>
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/80">Address</p>
      <Field label="Street"><input value={b.address.street} onChange={(e) => setAddr("street", e.target.value)} className={inp} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="City"><input value={b.address.city} onChange={(e) => setAddr("city", e.target.value)} className={inp} /></Field>
        <Field label="State"><input value={b.address.state} onChange={(e) => setAddr("state", e.target.value)} className={inp} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Postcode"><input value={b.address.zip} onChange={(e) => setAddr("zip", e.target.value)} className={inp} /></Field>
        <Field label="Country"><input value={b.address.country} onChange={(e) => setAddr("country", e.target.value)} className={inp} /></Field>
      </div>
      <button
        type="button"
        onClick={() =>
          startTransition(async () => {
            await saveWorkspaceBillingAction(b);
            setStatus("saved");
            setTimeout(() => setStatus("idle"), 1600);
            router.refresh();
          })
        }
        className="rounded-full bg-oxblood px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90"
      >
        {status === "saved" ? "Saved ✓" : "Save workspace"}
      </button>
    </Card>
  );
}

const ADDON_META: {
  key: keyof SocialAddons;
  label: string;
  desc: string;
  price: string;
}[] = [
  {
    key: "chatbox",
    label: "Website chatbox",
    desc: "Lead-capture assistant on each client's site.",
    price: "+$20/mo",
  },
  {
    key: "reports",
    label: "Performance reports",
    desc: "Monthly client-facing results reports.",
    price: "+$15/mo",
  },
];

function BillingTab({
  currentPlan,
  planStatus,
  stripeReady,
  addons,
}: {
  currentPlan: SocialPlan;
  planStatus: string;
  stripeReady: boolean;
  addons: SocialAddons;
}) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [busy, setBusy] = useState(false);
  const [addonState, setAddonState] = useState<SocialAddons>(addons);
  const [, startAddon] = useTransition();
  const addonRouter = useRouter();

  function toggleAddon(key: keyof SocialAddons) {
    const next = { ...addonState, [key]: !addonState[key] };
    setAddonState(next);
    startAddon(async () => {
      await saveAddonsAction(next);
      // Re-fetch server components (incl. the client sub-nav) so the section
      // appears/disappears immediately across the app.
      addonRouter.refresh();
    });
  }

  async function switchTo(plan: SocialPlan) {
    setBusy(true);
    try {
      const res = await fetch("/api/social/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string };
      if (data.url) window.location.href = data.url;
      else alert("Card checkout is being finalised — we'll activate your plan by email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Current plan">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-2xl capitalize text-oxblood">{currentPlan}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-ink/85">
              {planStatus} · A${SOCIAL_PLAN_PRICE[currentPlan].monthly}/mo
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="rounded-full border border-ink/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/80 hover:border-oxblood hover:text-oxblood">
              Manage billing
            </button>
            <button type="button" className="rounded-full border border-ink/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/85 hover:border-rose hover:text-rose">
              Cancel
            </button>
          </div>
        </div>
      </Card>

      <Card title="Change account type">
        <div className="inline-flex rounded-full border border-ink/15 p-0.5 text-[11px] font-semibold uppercase tracking-[0.12em]">
          {(["monthly", "yearly"] as BillingInterval[]).map((iv) => (
            <button
              key={iv}
              type="button"
              onClick={() => setInterval(iv)}
              className={`rounded-full px-4 py-1.5 ${interval === iv ? "bg-oxblood text-cream" : "text-ink/85"}`}
            >
              {iv}
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(["personal", "agency"] as SocialPlan[]).map((plan) => (
            <div key={plan} className="rounded-xl border border-ink/12 p-4">
              <p className="font-display text-xl capitalize text-oxblood">{plan}</p>
              <p className="mt-1 text-sm font-semibold text-ink">
                A${SOCIAL_PLAN_PRICE[plan][interval]}
                <span className="text-[11px] font-medium text-ink/80">/{interval === "monthly" ? "mo" : "yr"}</span>
              </p>
              <button
                type="button"
                disabled={busy || plan === currentPlan}
                onClick={() => switchTo(plan)}
                className="mt-3 w-full rounded-full bg-oxblood px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {plan === currentPlan ? "Current plan" : `Switch to ${plan}`}
              </button>
            </div>
          ))}
        </div>
        {!stripeReady && (
          <p className="mt-3 text-[11px] text-ink/80">
            Add your Stripe keys + the four price IDs in Netlify to enable live switching.
          </p>
        )}
      </Card>

      <Card title="Add-ons">
        <p className="text-[11px] text-ink/70">
          Turn features on or off — the dashboard unlocks them instantly.
        </p>
        <div className="mt-2 space-y-2">
          {ADDON_META.map((a) => {
            const on = addonState[a.key];
            return (
              <div
                key={a.key}
                className="flex items-center justify-between rounded-xl border border-ink/12 p-3"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {a.label}{" "}
                    <span className="text-[11px] font-medium text-ink/60">
                      {a.price}
                    </span>
                  </p>
                  <p className="text-[11px] text-ink/70">{a.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleAddon(a.key)}
                  aria-label={`${on ? "Disable" : "Enable"} ${a.label}`}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-oxblood" : "bg-ink/20"}`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink/10 p-5">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-widest text-ink/90">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink/20 px-5 py-10 text-center text-[12px] font-medium text-ink/80">
      {text}
    </div>
  );
}

const SUPPORT_EMAIL = "hello.replyora@gmail.com";

function PreferencesTab({ optIn, email }: { optIn: boolean; email: string }) {
  const router = useRouter();
  const [on, setOn] = useState(optIn);
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next);
    startTransition(async () => {
      await saveNewsletterOptInAction(next);
      router.refresh();
      toast({ title: next ? "Subscribed to the newsletter" : "Unsubscribed", type: "success" });
    });
  }

  return (
    <div className="space-y-6">
      <Card title="Monthly newsletter">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-ink">Product news &amp; social tips, once a month.</p>
            <p className="mt-0.5 text-[12px] text-ink/70">Sent to {email}. Unsubscribe anytime.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            onClick={toggle}
            className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-oxblood" : "bg-ink/20"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
      </Card>
    </div>
  );
}

function DataTab() {
  const [reason, setReason] = useState("");
  const [requested, setRequested] = useState(false);
  const [, startTransition] = useTransition();

  function submitDeletion() {
    startTransition(async () => {
      await requestDeletionAction(reason);
      setRequested(true);
      toast({ title: "Deletion request received", type: "success" });
    });
  }

  return (
    <div className="space-y-6">
      <Card title="Export your data">
        <p className="text-sm text-ink/85">
          Download everything in your workspace — clients, posts, invoices and tasks — as a JSON file.
        </p>
        <a
          href="/api/social/export"
          className="inline-flex rounded-full border border-oxblood/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-oxblood transition-colors hover:bg-oxblood/5"
        >
          Export workspace data
        </a>
      </Card>

      <Card title="Delete your account">
        <p className="text-sm text-ink/85">
          Request permanent deletion of your workspace and all its data. We action requests manually within 30 days.
        </p>
        {requested ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-[12px] font-medium text-emerald-800">
            Request received. We&rsquo;ll be in touch at your account email. Questions? {SUPPORT_EMAIL}
          </p>
        ) : (
          <>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Optional — tell us why you're leaving so we can improve."
              className={inp}
            />
            <button
              type="button"
              onClick={submitDeletion}
              className="inline-flex rounded-full border border-red-300 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-600 transition-colors hover:bg-red-50"
            >
              Request account deletion
            </button>
          </>
        )}
      </Card>

      <Card title="Contact">
        <p className="text-sm text-ink/85">
          Need a hand with an export or anything else? Email us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-oxblood hover:underline">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </Card>
    </div>
  );
}
