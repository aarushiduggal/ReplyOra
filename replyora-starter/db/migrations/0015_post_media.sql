-- 0015_post_media.sql
-- Carousels, and video as a first-class citizen.
--
-- Until now a post held exactly ONE piece of media (social_posts.media_url), so
-- a carousel was structurally impossible — the "+ Carousel" button in the Grid
-- linked to Studio and did nothing. This adds an ordered media list per post.
--
-- social_posts.media_url is KEPT and kept in sync with position 0. Every
-- existing read path (grid tiles, calendar, approvals, the publisher's
-- single-image path) keeps working untouched; only code that needs all the
-- slides reads post_media. That means this migration cannot break anything
-- already live.
--
-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS post_media (
  id         TEXT PRIMARY KEY,
  post_id    TEXT NOT NULL REFERENCES social_posts (id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  -- "image" | "video". Instagram will not mix video into a carousel that
  -- started as images, so the publisher checks this before building one.
  kind       TEXT NOT NULL DEFAULT 'image',
  -- 0-based slide order. Position 0 mirrors social_posts.media_url.
  position   INT  NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per slot per post: makes reordering an upsert rather than a
-- delete-and-hope, and stops a double-submit creating duplicate slides.
CREATE UNIQUE INDEX IF NOT EXISTS post_media_post_position_idx
  ON post_media (post_id, position);
CREATE INDEX IF NOT EXISTS post_media_post_idx ON post_media (post_id, position);

-- Backfill: every existing post with media becomes a one-slide carousel, so
-- there is no "some posts have media rows and some don't" special case.
INSERT INTO post_media (id, post_id, url, kind, position)
SELECT
  'pm_' || p.id,
  p.id,
  p.media_url,
  COALESCE(NULLIF(p.media_kind, ''), 'image'),
  0
FROM social_posts p
WHERE p.media_url IS NOT NULL
  AND p.media_url <> ''
  AND NOT EXISTS (SELECT 1 FROM post_media m WHERE m.post_id = p.id);
