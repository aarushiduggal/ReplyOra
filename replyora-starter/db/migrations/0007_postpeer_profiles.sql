-- ReplyOra Social — PostPeer profiles (agency multi-client publishing).
-- Run once in the Neon SQL editor, AFTER 0006_facebook.sql.
--
-- Each client maps to one PostPeer "profile" that groups THAT client's own
-- connected social accounts. We store the profile id here so the connect flow
-- and the account sync target the right client.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS postpeer_profile_id TEXT;
