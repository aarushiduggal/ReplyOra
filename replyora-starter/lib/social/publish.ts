import { neon } from "@neondatabase/serverless";

/**
 * ReplyOra Social — publishing engine (Instagram + TikTok, direct APIs).
 *
 * publishPost() loads the post + the client's stored OAuth token and pushes it
 * live, then flips status → published (or records publish_error). Session-less
 * and scoped by explicit workspace_id, so both the "publish now" action and the
 * secret-guarded cron can call it.
 *
 * Dormant until the platform apps + a connected client exist. Schema:
 * db/migrations/0004_publishing.sql.
 */

export const HAS_META = Boolean(
  process.env.META_APP_ID && process.env.META_APP_SECRET,
);
/**
 * Instagram API with Instagram Login (the smoother flow — clients log in with
 * Instagram directly, no linked Facebook Page needed). When these are set we
 * prefer it over Facebook Login and talk to graph.instagram.com.
 */
export const HAS_INSTAGRAM_LOGIN = Boolean(
  process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET,
);
export const HAS_TIKTOK = Boolean(
  process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET,
);
/**
 * PostPeer — a managed publishing API with a free tier (20 posts/mo, no card)
 * and pay-per-post after (credits never expire, no subscription). It has already
 * cleared Meta's review, so setting POSTPEER_API_KEY lets us post to Instagram
 * (and TikTok) for real with no App Review on our side. This is our default
 * real-publishing engine — cheapest path that actually posts.
 */
export const HAS_POSTPEER = Boolean(process.env.POSTPEER_API_KEY);

/** True when a post can actually go live (any real engine is configured). */
export const HAS_PUBLISHER =
  HAS_POSTPEER || HAS_META || HAS_INSTAGRAM_LOGIN || HAS_TIKTOK;

const GRAPH = "https://graph.facebook.com/v21.0";
/** Instagram-Login tokens publish via graph.instagram.com (same endpoints). */
const IG_GRAPH = "https://graph.instagram.com/v21.0";
const POSTPEER = "https://api.postpeer.dev/v1";

const hasDb = (): boolean => Boolean(process.env.DATABASE_URL);
let _sql: ReturnType<typeof neon> | null = null;
function sql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _sql = neon(url);
  }
  return _sql;
}

interface PostRow {
  id: string;
  client_id: string;
  platform: string;
  caption: string | null;
  hashtags: string[] | null;
  media_url: string | null;
  media_kind: string | null;
}
interface ConnRow {
  external_account_id: string | null;
  access_token: string | null;
}

export interface PublishOutcome {
  ok: boolean;
  externalId?: string;
  error?: string;
}

function fullCaption(r: PostRow): string {
  const tags = (r.hashtags ?? []).join(" ");
  return [r.caption ?? "", tags].filter(Boolean).join("\n\n");
}

/** Publish one post live, then record the result. Scoped by workspace_id. */
export async function publishPost(
  workspaceId: string,
  postId: string,
): Promise<PublishOutcome> {
  if (!hasDb()) return { ok: false, error: "no_database" };

  const rows = (await sql()`
    SELECT id, client_id, platform, caption, hashtags, media_url, media_kind
    FROM social_posts WHERE id = ${postId} AND workspace_id = ${workspaceId} LIMIT 1
  `) as PostRow[];
  const post = rows[0];
  if (!post) return { ok: false, error: "post_not_found" };
  if (!post.media_url) {
    return await fail(workspaceId, postId, "no_media");
  }

  // Managed API (PostPeer) — posts for real without our own App Review. Needs the
  // PostPeer account id for this client+platform (stored on the connection, or an
  // env default for single-account setups).
  if (HAS_POSTPEER) {
    try {
      const outcome = await publishViaPostPeer(post);
      if (!outcome.ok) {
        return await fail(workspaceId, postId, outcome.error ?? "publish_failed");
      }
      await sql()`
        UPDATE social_posts SET
          status = 'published',
          external_post_id = ${outcome.externalId ?? null},
          published_at = now(),
          publish_error = NULL
        WHERE id = ${postId} AND workspace_id = ${workspaceId}
      `;
      return outcome;
    } catch (e) {
      return await fail(workspaceId, postId, (e as Error).message.slice(0, 200));
    }
  }

  const conns = (await sql()`
    SELECT external_account_id, access_token
    FROM client_connections
    WHERE client_id = ${post.client_id} AND platform = ${post.platform} LIMIT 1
  `) as ConnRow[];
  const conn = conns[0];
  if (!conn?.access_token) {
    return await fail(workspaceId, postId, `${post.platform}_not_connected`);
  }

  try {
    const outcome =
      post.platform === "instagram"
        ? await publishInstagram(conn, post)
        : post.platform === "facebook"
          ? await publishFacebook(conn, post)
          : await publishTikTok(conn, post);
    if (!outcome.ok) return await fail(workspaceId, postId, outcome.error ?? "publish_failed");

    await sql()`
      UPDATE social_posts SET
        status = 'published',
        external_post_id = ${outcome.externalId ?? null},
        published_at = now(),
        publish_error = NULL
      WHERE id = ${postId} AND workspace_id = ${workspaceId}
    `;
    return outcome;
  } catch (e) {
    return await fail(workspaceId, postId, (e as Error).message.slice(0, 200));
  }
}

async function fail(
  workspaceId: string,
  postId: string,
  error: string,
): Promise<PublishOutcome> {
  await sql()`
    UPDATE social_posts SET publish_error = ${error}
    WHERE id = ${postId} AND workspace_id = ${workspaceId}
  `;
  return { ok: false, error };
}

/**
 * PostPeer — post to Instagram/TikTok via the managed API. Each connected
 * account has a PostPeer account id; we store it on client_connections
 * (external_account_id) per client+platform. For a single-account setup you can
 * instead set POSTPEER_IG_ACCOUNT_ID / POSTPEER_TIKTOK_ACCOUNT_ID as a default.
 */
async function publishViaPostPeer(post: PostRow): Promise<PublishOutcome> {
  const platform = post.platform; // "instagram" | "tiktok" | "facebook"

  // Per-client account id (preferred), else an env default for single-account use.
  let accountId: string | null = null;
  const conn = (await sql()`
    SELECT external_account_id FROM client_connections
    WHERE client_id = ${post.client_id} AND platform = ${post.platform} LIMIT 1
  `) as { external_account_id: string | null }[];
  accountId = conn[0]?.external_account_id ?? null;
  if (!accountId) {
    const envDefault: Record<string, string | undefined> = {
      instagram: process.env.POSTPEER_IG_ACCOUNT_ID,
      tiktok: process.env.POSTPEER_TIKTOK_ACCOUNT_ID,
      facebook: process.env.POSTPEER_FB_ACCOUNT_ID,
    };
    accountId = envDefault[platform] ?? null;
  }
  if (!accountId) return { ok: false, error: `${platform}_not_linked` };

  const res = await fetch(`${POSTPEER}/posts`, {
    method: "POST",
    headers: {
      "x-access-key": process.env.POSTPEER_API_KEY ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: fullCaption(post),
      mediaItems: [
        { url: post.media_url, type: post.media_kind === "video" ? "video" : "image" },
      ],
      platforms: [{ platform, accountId }],
      publishNow: true,
    }),
  });
  const data = (await res.json()) as {
    success?: boolean;
    status?: string;
    postId?: string;
    platforms?: { platform: string; success?: boolean; error?: string; platformPostUrl?: string }[];
    error?: string;
    message?: string;
  };

  const platResult = data.platforms?.[0];
  const ok = res.ok && data.success !== false && platResult?.success !== false;
  if (!ok) {
    const msg =
      platResult?.error ?? data.error ?? data.message ?? "postpeer_failed";
    return { ok: false, error: msg };
  }
  return { ok: true, externalId: data.postId };
}

/** Instagram Graph API: create a media container, then publish it. */
async function publishInstagram(
  conn: ConnRow,
  post: PostRow,
): Promise<PublishOutcome> {
  const igUser = conn.external_account_id;
  const token = conn.access_token!;
  if (!igUser) return { ok: false, error: "no_ig_account" };

  // Instagram-Login tokens use graph.instagram.com + /me (the stored id doesn't
  // resolve on the publish endpoint); Facebook-Login page tokens use
  // graph.facebook.com + the explicit IG business id.
  const base = HAS_INSTAGRAM_LOGIN ? IG_GRAPH : GRAPH;
  const target = HAS_INSTAGRAM_LOGIN ? "me" : igUser;

  const caption = fullCaption(post);
  const isVideo = post.media_kind === "video";
  const createParams = new URLSearchParams({ caption, access_token: token });
  if (isVideo) {
    createParams.set("media_type", "REELS");
    createParams.set("video_url", post.media_url!);
  } else {
    createParams.set("image_url", post.media_url!);
  }

  const createRes = await fetch(`${base}/${target}/media`, {
    method: "POST",
    body: createParams,
  });
  const created = (await createRes.json()) as { id?: string; error?: { message?: string } };
  if (!createRes.ok || !created.id) {
    return { ok: false, error: created.error?.message ?? "ig_container_failed" };
  }

  const pubRes = await fetch(`${base}/${target}/media_publish`, {
    method: "POST",
    body: new URLSearchParams({ creation_id: created.id, access_token: token }),
  });
  const published = (await pubRes.json()) as { id?: string; error?: { message?: string } };
  if (!pubRes.ok || !published.id) {
    return { ok: false, error: published.error?.message ?? "ig_publish_failed" };
  }
  return { ok: true, externalId: published.id };
}

/** Facebook Page Graph API: post a photo or video to the Page's feed. */
async function publishFacebook(
  conn: ConnRow,
  post: PostRow,
): Promise<PublishOutcome> {
  const pageId = conn.external_account_id;
  const token = conn.access_token!;
  if (!pageId) return { ok: false, error: "no_fb_page" };

  const caption = fullCaption(post);
  const isVideo = post.media_kind === "video";
  const endpoint = isVideo ? "videos" : "photos";
  const params = new URLSearchParams({ access_token: token, published: "true" });
  if (isVideo) {
    params.set("file_url", post.media_url!);
    params.set("description", caption);
  } else {
    params.set("url", post.media_url!);
    params.set("caption", caption);
  }

  const res = await fetch(`${GRAPH}/${pageId}/${endpoint}`, {
    method: "POST",
    body: params,
  });
  const data = (await res.json()) as {
    id?: string;
    post_id?: string;
    error?: { message?: string };
  };
  const id = data.post_id ?? data.id;
  if (!res.ok || !id) {
    return { ok: false, error: data.error?.message ?? "fb_publish_failed" };
  }
  return { ok: true, externalId: id };
}

/** TikTok Content Posting API: direct-post a video by pulling the media URL. */
async function publishTikTok(
  conn: ConnRow,
  post: PostRow,
): Promise<PublishOutcome> {
  if (post.media_kind !== "video") {
    return { ok: false, error: "tiktok_requires_video" };
  }
  const token = conn.access_token!;
  const res = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      post_info: { title: fullCaption(post).slice(0, 2200), privacy_level: "PUBLIC_TO_EVERYONE" },
      source_info: { source: "PULL_FROM_URL", video_url: post.media_url },
    }),
  });
  const data = (await res.json()) as {
    data?: { publish_id?: string };
    error?: { message?: string; code?: string };
  };
  if (!res.ok || !data.data?.publish_id) {
    return { ok: false, error: data.error?.message ?? "tiktok_init_failed" };
  }
  // Direct-post publishing is asynchronous on TikTok's side; the publish_id is
  // our external reference (status can be polled later via /post/publish/status).
  return { ok: true, externalId: data.data.publish_id };
}

/** Posts due to publish now: scheduled, past their time, approved, no prior error. */
export async function listDuePosts(): Promise<
  { postId: string; workspaceId: string }[]
> {
  if (!hasDb()) return [];
  const rows = (await sql()`
    SELECT p.id AS post_id, p.workspace_id
    FROM social_posts p
    LEFT JOIN approvals a ON a.post_id = p.id
    WHERE p.status = 'scheduled'
      AND p.scheduled_for IS NOT NULL
      AND p.scheduled_for <= now()
      AND p.publish_error IS NULL
      AND (a.status IS NULL OR a.status = 'approved')
    LIMIT 100
  `) as { post_id: string; workspace_id: string }[];
  return rows.map((r) => ({ postId: r.post_id, workspaceId: r.workspace_id }));
}
