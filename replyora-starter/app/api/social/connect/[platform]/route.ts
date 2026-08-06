import { NextResponse } from "next/server";

import { HAS_META, HAS_INSTAGRAM_LOGIN, HAS_TIKTOK } from "@/lib/social/publish";
import {
  HAS_POSTPEER,
  ensureClientProfile,
  getConnectUrl,
  type PPPlatform,
} from "@/lib/social/postpeer";
import { getClient } from "@/lib/social/clients";

export const runtime = "nodejs";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://replyora.net").replace(/\/$/, "");

/**
 * Start the OAuth flow to connect a client's Instagram (via Meta) or TikTok.
 * GET /api/social/connect/{platform}?client={clientId}
 * The clientId rides in `state` and is verified on the callback.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;
  const clientId = new URL(req.url).searchParams.get("client") ?? "";
  const back = `${APP_URL}/clients/${clientId}/integrations`;

  // Managed API (PostPeer): the CLIENT connects their own account. We create/reuse
  // the client's profile, then send them to PostPeer's OAuth URL for this platform.
  if (
    HAS_POSTPEER &&
    (platform === "instagram" || platform === "tiktok" || platform === "facebook")
  ) {
    if (!clientId) return NextResponse.redirect(`${back}?integration=error`);
    try {
      const client = await getClient(clientId);
      if (!client) return NextResponse.redirect(`${back}?integration=error`);
      const profileId = await ensureClientProfile(clientId, client.name);
      const url = await getConnectUrl(platform as PPPlatform, profileId);
      return NextResponse.redirect(url);
    } catch {
      return NextResponse.redirect(`${back}?integration=error`);
    }
  }

  if (platform === "instagram") {
    const redirectUri = `${APP_URL}/api/social/connect/instagram/callback`;

    // Preferred: Instagram API with Instagram Login (client logs in with IG,
    // no linked Facebook Page needed).
    if (HAS_INSTAGRAM_LOGIN) {
      // Must match the permissions added to the app's Instagram use case.
      // Minimal core: basic (read media for the live grid) + content_publish (post).
      // manage_comments / manage_insights can be added later for comments + Reports.
      const scope = [
        "instagram_business_basic",
        "instagram_business_content_publish",
      ].join(",");
      const url =
        `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1` +
        `&client_id=${process.env.INSTAGRAM_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code&scope=${encodeURIComponent(scope)}` +
        `&state=${encodeURIComponent(clientId)}`;
      return NextResponse.redirect(url);
    }

    // Facebook Login (IG must be linked to a Facebook Page — the person logs in
    // with their Facebook profile that admins the Page).
    if (!HAS_META) return NextResponse.redirect(`${back}?integration=not_configured`);
    // "Facebook Login for Business" uses a saved Configuration (config_id) that
    // defines the permissions/assets. When META_LOGIN_CONFIG_ID is set we use it;
    // otherwise we fall back to a classic scope-based request.
    const configId = process.env.META_LOGIN_CONFIG_ID;
    const grant = configId
      ? `&config_id=${encodeURIComponent(configId)}`
      : `&scope=${encodeURIComponent("instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,business_management")}`;
    const url =
      `https://www.facebook.com/v21.0/dialog/oauth?client_id=${process.env.META_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(clientId)}` +
      grant +
      `&response_type=code`;
    return NextResponse.redirect(url);
  }

  if (platform === "tiktok") {
    if (!HAS_TIKTOK) return NextResponse.redirect(`${back}?integration=not_configured`);
    const redirectUri = `${APP_URL}/api/social/connect/tiktok/callback`;
    const scope = "user.info.basic,video.publish";
    const url =
      `https://www.tiktok.com/v2/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}` +
      `&scope=${encodeURIComponent(scope)}&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(clientId)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(back);
}
