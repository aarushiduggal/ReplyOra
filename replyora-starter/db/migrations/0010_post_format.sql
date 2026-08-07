-- 0010_post_format.sql
-- Adds the content format (Post / Reel / Carousel / Story) shown on the calendar.
-- Safe to run more than once.

ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS format text NOT NULL DEFAULT 'post';
