-- ReplyOra Social — add Facebook as a third publishable platform.
-- Run once in the Neon SQL editor, AFTER 0005_ayrshare.sql.
--
-- client_connections.platform was CHECK (platform IN ('instagram','tiktok')).
-- Widen it to allow 'facebook' so a client can link a Facebook Page too.

ALTER TABLE client_connections
  DROP CONSTRAINT IF EXISTS client_connections_platform_check;

ALTER TABLE client_connections
  ADD CONSTRAINT client_connections_platform_check
  CHECK (platform IN ('instagram', 'tiktok', 'facebook'));
