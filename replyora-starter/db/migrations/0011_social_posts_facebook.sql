-- 0011_social_posts_facebook.sql
-- social_posts.platform still carried the original CHECK (platform IN
-- ('instagram','tiktok')) from 0001 — 0006 only widened client_connections.
-- So adding a Facebook tile (or scheduling a Facebook post) threw a constraint
-- violation and 500'd the Grid. Widen it to include 'facebook'.
-- Safe to run more than once.

ALTER TABLE social_posts
  DROP CONSTRAINT IF EXISTS social_posts_platform_check;

ALTER TABLE social_posts
  ADD CONSTRAINT social_posts_platform_check
  CHECK (platform IN ('instagram', 'tiktok', 'facebook'));
