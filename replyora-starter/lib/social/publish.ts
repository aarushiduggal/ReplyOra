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
export const HAS_TIKTOK = Boolean(
  process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET,
);
/**
 * Ayrshare — a managed publishing API. It has already cleared Meta/TikTok App
 * Review, so setting AYRSHARE_API_KEY lets us post to Instagram + TikTok for
 * real with zero approval on our side. When present it takes over publishing.
 */
export const HAS_AYRSHARE = Boolean(process.env.AYRSHARE_API_KEY);

/** True when a post can actually go live (any real engine is configured). */
export const HAS_PUBLISHER = HAS_AYRSHARE || HAS_META || HAS_TIKTOK;

const GRAPH = "https://graph.facebook.com/v21.0";
const AYRSHARE = "https://api.ayrshare.com/api";

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

  // Managed API (Ayrshare) — posts for real without our own App Review. It holds
  // the social connections, so no per-client OAuth token is needed here.
  if (HAS_AYRSHARE) {
    try {
      const outcome = await publishViaAyrshare(post);
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
 * Ayrshare — post to Instagram/TikTok via the managed API. With a single linked
 * account, posts go to the default profile. For agencies, an optional per-client
 * profile key (clients.ayrshare_profile_key, migration 0005) routes each client's
 * posts to their own linked accounts. If that column isn't present yet we simply
 * fall back to the default profile, so posting works before the migration is run.
 */
async function publishViaAyrshare(post: PostRow): Promise<PublishOutcome> {
  const platform = post.platform === "instagram" ? "instagram" : "tiktok";

  let profileKey: string | null = null;
  try {
    const r = (await sql()`
      SELECT ayrshare_profile_key FROM clients WHERE id = ${post.client_id} LIMIT 1
    `) as { ayrshare_profile_key: string | null }[];
    profileKey = r[0]?.ayrshare_profile_key ?? null;
  } catch {
    /* column not present yet — post to the default profile */
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${process.env.AYRSHARE_API_KEY}`,
    "Content-Type": "application/json",
  };
  if (profileKey) headers["Profile-Key"] = profileKey;

  const res = await fetch(`${AYRSHARE}/post`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      post: fullCaption(post),
      platforms: [platform],
      mediaUrls: [post.media_url],
      ...(post.media_kind === "video" ? { isVideo: true } : {}),
    }),
  });
  const data = (await res.json()) as {
    status?: string;
    postIds?: { platform: string; id?: string; postUrl?: string }[];
    errors?: ({ message?: string } | string)[];
    message?: string;
  };
  if (data.status === "success" && data.postIds && data.postIds.length > 0) {
    return { ok: true, externalId: data.postIds[0]?.id };
  }
  const err = data.errors?.[0];
  const msg =
    (typeof err === "string" ? err : err?.message) ??
    data.message ??
    "ayrshare_failed";
  return { ok: false, error: msg };
}

/** Instagram Graph API: create a media container, then publish it. */
async function publishInstagram(
  conn: ConnRow,
  post: PostRow,
): Promise<PublishOutcome> {
  const igUser = conn.external_account_id;
  const token = conn.access_token!;
  if (!igUser) return { ok: false, error: "no_ig_account" };

  const caption = fullCaption(post);
  const isVideo = post.media_kind === "video";
  const createParams = new URLSearchParams({ caption, access_token: token });
  if (isVideo) {
    createParams.set("media_type", "REELS");
    createParams.set("video_url", post.media_url!);
  } else {
    createParams.set("image_url", post.media_url!);
  }

  const createRes = await fetch(`${GRAPH}/${igUser}/media`, {
    method: "POST",
    body: createParams,
  });
  const created = (await createRes.json()) as { id?: string; error?: { message?: string } };
  if (!createRes.ok || !created.id) {
    return { ok: false, error: created.error?.message ?? "ig_container_failed" };
  }

  const pubRes = await fetch(`${GRAPH}/${igUser}/media_publish`, {
    method: "POST",
    body: new URLSearchParams({ creation_id: created.id, access_token: token }),
  });
  const published = (await pubRes.json()) as { id?: string; error?: { message?: string } };
  if (!pubRes.ok || !published.id) {
    return { ok: false, error: published.error?.message ?? "ig_publish_failed" };
  }
  return { ok: true, externalId: published.id };
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
