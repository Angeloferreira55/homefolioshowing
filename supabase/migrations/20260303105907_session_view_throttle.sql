-- Add column to throttle session viewed notifications (once per 24h)
ALTER TABLE showing_sessions
  ADD COLUMN IF NOT EXISTS last_view_notified_at timestamptz;
