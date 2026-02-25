-- Add session_type column to distinguish Home Folio from Pop-By Folio
ALTER TABLE showing_sessions ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'home_folio';
