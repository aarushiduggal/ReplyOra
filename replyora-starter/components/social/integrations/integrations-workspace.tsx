"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Facebook, Instagram, Music2, RefreshCw, Zap } from "lucide-react";

import {
  disconnectAction,
  toggleIntegrationAction,
} from "@/app/(social)/clients/[id]/integrations/actions";
import { GuideTrigger } from "@/components/social/guide";

type ConnPlatform = "instagram" | "tiktok" | "facebook";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function IntegrationsWorkspace({
  clientId,
  clientName,
  platforms,
  metaReady,
  tiktokReady,
  postpeerReady,
  linkedAccounts,
  linkedHandles,
}: {
  clientId: string;
  clientName: string;
  platforms: string[];
  metaReady: boolean;
  tiktokReady: boolean;
  postpeerReady: boolean;
  linkedAccounts: Record<string, string>;
  linkedHandles: Record<string, string>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [refreshing, startTransition] = useTransition();

  // Surface the OAuth callback result so a connect attempt never silently no-ops.
  const connectedParam = params.get("connected");
  const errorParam = params.get("integration");
  const banner = connectedParam
    ? { kind: "ok" as const, text: `${cap(connectedParam)} connected 🎉` }
    : errorParam === "no_ig"
      ? { kind: "err" as const, text: "Connected, but no Instagram Business account was found on that login. Make sure the account is a Professional (Business/Creator) account, then try again." }
      : errorParam === "not_configured"
        ? { kind: "err" as const, text: "Instagram isn't configured yet — check the Netlify keys." }
        : errorParam === "error"
          ? { kind: "err" as const, text: "Couldn't connect. The login was cancelled or the redirect URL doesn't match — try again." }
          : null;

  function stubConnect(platform: "instagram" | "tiktok") {
    startTransition(async () => {
      await toggleIntegrationAction(clientId, platform, true);
      router.refresh();
    });
  }
  function disconnect(platform: ConnPlatform) {
    startTransition(async () => {
      await disconnectAction(clientId, platform);
      router.refresh();
    });
  }
  // The page re-syncs connected accounts from PostPeer on every load, so a plain
  // refresh pulls in an account the client just authorised.
  function refresh() {
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/85">
          <span className="text-oxblood">( 10 )</span> Integrations
          <GuideTrigger pageKey="integrations" clientId={clientId} />
        </div>
      </div>
      <p className="mb-6 text-[12px] font-medium text-ink/85">
        Connect social accounts for <strong>{clientName}</strong> only. Published posts
        flow back onto the Grid and power Reports.
      </p>

      {banner && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-[12px] font-medium ${
            banner.kind === "ok"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-rose/40 bg-rose/5 text-oxblood"
          }`}
        >
          {banner.text}
        </div>
      )}

      {postpeerReady ? (
        <>
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <Zap className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">Auto-publishing is live</p>
              <p className="mt-0.5 text-[12px] text-emerald-800/90">
                Click <strong>Connect</strong> below and {clientName} signs in to authorise{" "}
                <em>their own</em> account — you never use your own logins. Once connected,
                hit <strong>Publish</strong> on any Calendar post and it goes out for real.
              </p>
            </div>
          </div>

          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/70 transition-colors hover:border-oxblood hover:text-oxblood disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ConnectAccount
              clientId={clientId}
              platform="instagram"
              icon={<Instagram className="h-5 w-5" />}
              name="Instagram"
              handle={linkedHandles.instagram}
              connected={Boolean(linkedAccounts.instagram)}
            />
            <ConnectAccount
              clientId={clientId}
              platform="tiktok"
              icon={<Music2 className="h-5 w-5" />}
              name="TikTok"
              handle={linkedHandles.tiktok}
              connected={Boolean(linkedAccounts.tiktok)}
            />
            <ConnectAccount
              clientId={clientId}
              platform="facebook"
              icon={<Facebook className="h-5 w-5" />}
              name="Facebook"
              handle={linkedHandles.facebook}
              connected={Boolean(linkedAccounts.facebook)}
            />
          </div>

          <p className="mt-6 text-[11px] text-ink/75">
            After the client authorises, hit <strong>Refresh</strong> if the account
            doesn&rsquo;t appear straight away. TikTok note: brand-new TikTok apps may post
            as a private draft until TikTok approves public posting — Instagram &amp;
            Facebook publish fully automatically.
          </p>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card
              icon={<Instagram className="h-5 w-5" />}
              name="Instagram"
              note="Paid feature"
              connected={platforms.includes("instagram")}
              oauthReady={metaReady}
              connectHref={`/api/social/connect/instagram?client=${clientId}`}
              onStubConnect={() => stubConnect("instagram")}
              onDisconnect={() => disconnect("instagram")}
            />
            <Card
              icon={<Music2 className="h-5 w-5" />}
              name="TikTok"
              connected={platforms.includes("tiktok")}
              oauthReady={tiktokReady}
              connectHref={`/api/social/connect/tiktok?client=${clientId}`}
              onStubConnect={() => stubConnect("tiktok")}
              onDisconnect={() => disconnect("tiktok")}
            />
          </div>

          <p className="mt-6 text-[11px] text-ink/75">
            {metaReady || tiktokReady
              ? "Connect authorises this client's account so scheduled posts publish automatically."
              : "You can publish today with no connection — the Calendar's Publish button hands you the ready-to-post caption and opens the app. Connect an account to upgrade to hands-off auto-publishing."}
          </p>
        </>
      )}
    </div>
  );
}

/**
 * A client account card for the PostPeer flow. "Connect" opens PostPeer's OAuth
 * (the client authorises their own account); once linked we show the handle.
 */
function ConnectAccount({
  clientId,
  platform,
  icon,
  name,
  handle,
  connected,
}: {
  clientId: string;
  platform: "instagram" | "tiktok" | "facebook";
  icon: React.ReactNode;
  name: string;
  handle?: string;
  connected: boolean;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-oxblood">
          {icon}
          <span className="font-display text-xl text-ink">{name}</span>
        </div>
        {connected && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-800">
            <Check className="h-3 w-3" /> Connected
          </span>
        )}
      </div>
      {connected && handle && (
        <p className="mt-2 text-[12px] font-medium text-ink/70">
          @{handle.replace(/^@+/, "")}
        </p>
      )}
      <div className="mt-4">
        {connected ? (
          <span className="text-[11px] font-medium text-ink/55">
            Posts publish to this account automatically.
          </span>
        ) : (
          <a
            href={`/api/social/connect/${platform}?client=${clientId}`}
            className="inline-block rounded-full bg-oxblood px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90"
          >
            Connect {name}
          </a>
        )}
      </div>
    </div>
  );
}

function Card({
  icon,
  name,
  note,
  connected,
  oauthReady,
  connectHref,
  onStubConnect,
  onDisconnect,
}: {
  icon: React.ReactNode;
  name: string;
  note?: string;
  connected: boolean;
  oauthReady: boolean;
  connectHref: string;
  onStubConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-oxblood">
          {icon}
          <span className="font-display text-xl text-ink">{name}</span>
        </div>
        {connected && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-800">
            <Check className="h-3 w-3" /> Connected
          </span>
        )}
      </div>
      {note && (
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/75">{note}</p>
      )}
      <div className="mt-4">
        {connected ? (
          <button
            type="button"
            onClick={onDisconnect}
            className="rounded-full border border-ink/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/85 hover:border-rose hover:text-rose"
          >
            Disconnect
          </button>
        ) : oauthReady ? (
          <a
            href={connectHref}
            className="inline-block rounded-full bg-oxblood px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90"
          >
            Connect {name}
          </a>
        ) : (
          <button
            type="button"
            onClick={onStubConnect}
            className="rounded-full bg-oxblood px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90"
          >
            Connect {name}
          </button>
        )}
      </div>
    </div>
  );
}
