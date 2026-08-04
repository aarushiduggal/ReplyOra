import { NextResponse } from "next/server";

import { HAS_META, HAS_TIKTOK } from "@/lib/social/publish";

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

  if (platform === "instagram") {
    if (!HAS_META) return NextResponse.redirect(`${back}?integration=not_configured`);
    const redirectUri = `${APP_URL}/api/social/connect/instagram/callback`;
    const scope =
      "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,business_management";
    const url =
      `https://www.facebook.com/v21.0/dialog/oauth?client_id=${process.env.META_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(clientId)}` +
      `&scope=${encodeURIComponent(scope)}&response_type=code`;
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
