-- ReplyOra Social — managed publishing via Ayrshare (optional, for agencies).
-- Run once in the Neon SQL editor, AFTER 0004_publishing.sql.
--
-- Ayrshare posts to Instagram/TikTok for real without our own Meta/TikTok App
-- Review. With a single AYRSHARE_API_KEY every post goes to the default linked
-- profile. Agencies on Ayrshare's Business plan get one "User Profile" per client;
-- store that client's Profile-Key here so each client's posts route to their own
-- accounts. Nullable — clients without a key fall back to the default profile.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS ayrshare_profile_key TEXT;
