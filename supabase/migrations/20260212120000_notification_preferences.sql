-- Add notification preference columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notify_session_viewed boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_feedback_submitted boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_photo_uploaded boolean NOT NULL DEFAULT true;
