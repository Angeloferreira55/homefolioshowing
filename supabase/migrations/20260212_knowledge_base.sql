-- Create knowledge_base table for AI Assistant RAG
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT, -- e.g., "sessions", "properties", "billing", "troubleshooting"
  keywords TEXT[], -- Array of keywords for better search
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add full-text search index
CREATE INDEX IF NOT EXISTS knowledge_base_search_idx ON knowledge_base
USING GIN (to_tsvector('english', title || ' ' || content));

-- Add category index for filtering
CREATE INDEX IF NOT EXISTS knowledge_base_category_idx ON knowledge_base(category);

-- Enable RLS
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read knowledge base
CREATE POLICY "Allow authenticated users to read knowledge base"
  ON knowledge_base FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update/delete (for admin management)
CREATE POLICY "Allow service role to manage knowledge base"
  ON knowledge_base FOR ALL
  TO service_role
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_knowledge_base_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_knowledge_base_updated_at_trigger
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_base_updated_at();

-- Insert sample knowledge base entries
INSERT INTO knowledge_base (title, content, category, keywords) VALUES
  ('How to Create a Session',
   'To create a new showing session: 1) Click "Create Session" from your dashboard, 2) Enter session title and description, 3) Set the showing date, 4) Add properties using PDF upload, Realtor.com link, or manual entry, 5) Add photos and documents, 6) Optionally set a password for privacy, 7) Click "Create" and share the link with clients.',
   'sessions',
   ARRAY['create', 'session', 'new', 'start', 'how to']),

  ('Adding Properties to Sessions',
   'You can add properties using three methods: PDF Upload (upload MLS listing PDF and HomeFolio extracts details automatically), Realtor.com Link (paste property URL and details are imported), or Manual Entry (fill in address, price, bedrooms, bathrooms, square footage manually). Each property can have multiple photos and documents attached.',
   'properties',
   ARRAY['add', 'property', 'upload', 'import', 'realtor.com', 'pdf', 'manual']),

  ('Sharing Sessions with Clients',
   'To share a session: 1) Open your session, 2) Click the "Share" button, 3) Copy the unique secure link, 4) Send to clients via email or text. Clients do not need to create an account to view sessions. You can optionally enable password protection for added security.',
   'sessions',
   ARRAY['share', 'link', 'client', 'send', 'access']),

  ('Subscription Plans Explained',
   'HomeFolio offers four plans: Starter (Free - 5 sessions, 1 property per session), Pro ($29/mo - unlimited sessions and properties), Team5 ($49/mo - up to 5 team members with full Pro features), and Team ($99/mo - up to 50 team members with team collaboration). Upgrade anytime from your Profile page.',
   'billing',
   ARRAY['subscription', 'plan', 'pricing', 'upgrade', 'billing', 'pro', 'team']),

  ('Photos Not Uploading',
   'If photos won''t upload, check: 1) File size (must be under 10MB per image), 2) Format (JPG and PNG supported), 3) Internet connection is stable. Try compressing large images or using a different browser if issues persist.',
   'troubleshooting',
   ARRAY['photo', 'upload', 'error', 'problem', 'fix', 'image']),

  ('Password Protection for Sessions',
   'To add password protection: When creating or editing a session, toggle on "Password Protection" and set a secure password. Share this password with your clients separately from the session link. Clients will need to enter the password before viewing the session.',
   'sessions',
   ARRAY['password', 'protect', 'security', 'private', 'secure']),

  ('Client Feedback and Ratings',
   'Clients can rate properties (1-5 stars), leave comments, and mark properties as favorites. View all feedback in Analytics or on the session page. This helps you understand client preferences and focus on properties they''re most interested in.',
   'analytics',
   ARRAY['feedback', 'rating', 'comment', 'favorite', 'client', 'preference']);

COMMENT ON TABLE knowledge_base IS 'Stores knowledge base articles for AI Assistant RAG (Retrieval Augmented Generation)';
