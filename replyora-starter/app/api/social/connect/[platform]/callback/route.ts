import { NextResponse } from "next/server";

import { HAS_META, HAS_INSTAGRAM_LOGIN, HAS_TIKTOK } from "@/lib/social/publish";
import { upsertConnection } from "@/lib/social/connections";

export const runtime = "nodejs";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://replyora.net").replace(/\/$/, "");
const GRAPH = "https://graph.facebook.com/v21.0";

/**
 * OAuth callback — exchange the code for a token and store the client's
 * connection. Runs in the agency's session, so upsertConnection is scoped to
 * their workspace and verifies the client (from `state`) belongs to them.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;
  const sp = new URL(req.url).searchParams;
  const code = sp.get("code");
  const clientId = sp.get("state") ?? "";
  const back = `${APP_URL}/clients/${clientId}/integrations`;
  if (!code || !clientId) {
    return NextResponse.redirect(`${back}?integration=error`);
  }

  try {
    // Instagram API with Instagram Login — exchange via api.instagram.com.
    if (platform === "instagram" && HAS_INSTAGRAM_LOGIN) {
      const redirectUri = `${APP_URL}/api/social/connect/instagram/callback`;
      // 1) code → short-lived IG user token + user_id
      const tokRes = await fetch("https://api.instagram.com/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.INSTAGRAM_APP_ID ?? "",
          client_secret: process.env.INSTAGRAM_APP_SECRET ?? "",
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
          code,
        }),
      });
      const tok = (await tokRes.json()) as { access_token?: string; user_id?: string | number };
      if (!tok.access_token || !tok.user_id) {
        return NextResponse.redirect(`${back}?integration=error`);
      }

      // 2) → long-lived IG token (~60 days)
      const llRes = await fetch(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token` +
          `&client_secret=${process.env.INSTAGRAM_APP_SECRET}` +
          `&access_token=${tok.access_token}`,
      );
      const ll = (await llRes.json()) as { access_token?: string; expires_in?: number };
      const token = ll.access_token ?? tok.access_token;
      const expiresAt = ll.expires_in
        ? new Date(Date.now() + ll.expires_in * 1000).toISOString()
        : null;

      // 3) username for display
      let username: string | null = null;
      try {
        const meRes = await fetch(
          `https://graph.instagram.com/me?fields=user_id,username&access_token=${token}`,
        );
        const me = (await meRes.json()) as { username?: string };
        username = me.username ?? null;
      } catch {
        /* username is optional */
      }

      await upsertConnection(clientId, "instagram", {
        externalAccountId: String(tok.user_id),
        externalUsername: username,
        accessToken: token,
        expiresAt,
      });
      return NextResponse.redirect(`${back}?connected=instagram`);
    }

    if (platform === "instagram" && HAS_META) {
      const redirectUri = `${APP_URL}/api/social/connect/instagram/callback`;
      // 1) code → short-lived user token
      const tokRes = await fetch(
        `${GRAPH}/oauth/access_token?client_id=${process.env.META_APP_ID}` +
          `&client_secret=${process.env.META_APP_SECRET}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&code=${encodeURIComponent(code)}`,
      );
      const tok = (await tokRes.json()) as { access_token?: string };
      if (!tok.access_token) return NextResponse.redirect(`${back}?integration=error`);

      // 2) → long-lived user token (~60 days)
      const llRes = await fetch(
        `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token` +
          `&client_id=${process.env.META_APP_ID}` +
          `&client_secret=${process.env.META_APP_SECRET}` +
          `&fb_exchange_token=${tok.access_token}`,
      );
      const ll = (await llRes.json()) as { access_token?: string; expires_in?: number };
      const userToken = ll.access_token ?? tok.access_token;
      const expiresAt = ll.expires_in
        ? new Date(Date.now() + ll.expires_in * 1000).toISOString()
        : null;

      // 3) find the page + its linked IG business account
      const pagesRes = await fetch(
        `${GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${userToken}`,
      );
      const pages = (await pagesRes.json()) as {
        data?: {
          id: string;
          access_token: string;
          instagram_business_account?: { id: string; username?: string };
        }[];
      };
      const page =
        pages.data?.find((p) => p.instagram_business_account) ?? pages.data?.[0];
      const ig = page?.instagram_business_account;
      if (!page || !ig) return NextResponse.redirect(`${back}?integration=no_ig`);

      await upsertConnection(clientId, "instagram", {
        externalAccountId: ig.id,
        externalUsername: ig.username ?? null,
        accessToken: page.access_token, // page token is what publishes
        expiresAt,
      });
      return NextResponse.redirect(`${back}?connected=instagram`);
    }

    if (platform === "facebook" && HAS_META) {
      const redirectUri = `${APP_URL}/api/social/connect/facebook/callback`;
      // 1) code → short-lived user token
      const tokRes = await fetch(
        `${GRAPH}/oauth/access_token?client_id=${process.env.META_APP_ID}` +
          `&client_secret=${process.env.META_APP_SECRET}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&code=${encodeURIComponent(code)}`,
      );
      const tok = (await tokRes.json()) as { access_token?: string };
      if (!tok.access_token) return NextResponse.redirect(`${back}?integration=error`);

      // 2) → long-lived user token
      const llRes = await fetch(
        `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token` +
          `&client_id=${process.env.META_APP_ID}` +
          `&client_secret=${process.env.META_APP_SECRET}` +
          `&fb_exchange_token=${tok.access_token}`,
      );
      const ll = (await llRes.json()) as { access_token?: string };
      const userToken = ll.access_token ?? tok.access_token;

      // 3) pick the Page the person admins → store its long-lived page token
      const pagesRes = await fetch(
        `${GRAPH}/me/accounts?fields=id,name,access_token&access_token=${userToken}`,
      );
      const pages = (await pagesRes.json()) as {
        data?: { id: string; name: string; access_token: string }[];
      };
      const page = pages.data?.[0];
      if (!page) return NextResponse.redirect(`${back}?integration=no_page`);

      await upsertConnection(clientId, "facebook", {
        externalAccountId: page.id,
        externalUsername: page.name ?? null,
        accessToken: page.access_token,
        expiresAt: null, // page tokens don't expire
      });
      return NextResponse.redirect(`${back}?connected=facebook`);
    }

    if (platform === "tiktok" && HAS_TIKTOK) {
      const redirectUri = `${APP_URL}/api/social/connect/tiktok/callback`;
      const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY ?? "",
          client_secret: process.env.TIKTOK_CLIENT_SECRET ?? "",
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      });
      const data = (await res.json()) as {
        access_token?: string;
        refresh_token?: string;
        open_id?: string;
        expires_in?: number;
      };
      if (!data.access_token) return NextResponse.redirect(`${back}?integration=error`);
      const expiresAt = data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000).toISOString()
        : null;

      await upsertConnection(clientId, "tiktok", {
        externalAccountId: data.open_id ?? null,
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? null,
        expiresAt,
      });
      return NextResponse.redirect(`${back}?connected=tiktok`);
    }
  } catch {
    return NextResponse.redirect(`${back}?integration=error`);
  }

  return NextResponse.redirect(back);
}
