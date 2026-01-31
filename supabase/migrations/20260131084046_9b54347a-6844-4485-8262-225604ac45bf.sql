-- =====================================================
-- SHOWING SESSIONS FEATURE - Database Schema
-- =====================================================

-- 1. PROFILES TABLE (for admin user data)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  company TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. SHOWING SESSIONS TABLE
CREATE TABLE public.showing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  session_date DATE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  notes TEXT,
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. SESSION PROPERTIES TABLE (properties within a session)
CREATE TABLE public.session_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.showing_sessions(id) ON DELETE CASCADE NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  price DECIMAL(12, 2),
  beds INTEGER,
  baths DECIMAL(3, 1),
  sqft INTEGER,
  photo_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. PROPERTY DOCUMENTS TABLE
CREATE TABLE public.property_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_property_id UUID REFERENCES public.session_properties(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  doc_type TEXT DEFAULT 'other',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. CLIENT RATINGS TABLE (for client feedback)
CREATE TABLE public.property_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_property_id UUID REFERENCES public.session_properties(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- =====================================================

-- Check if current user is admin of a session
CREATE OR REPLACE FUNCTION public.is_session_admin(session_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.showing_sessions
    WHERE id = session_id AND admin_id = auth.uid()
  );
$$;

-- Get session_id from a session_property_id
CREATE OR REPLACE FUNCTION public.get_session_id_from_property(property_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT session_id FROM public.session_properties WHERE id = property_id LIMIT 1;
$$;

-- Check if a share token is valid
CREATE OR REPLACE FUNCTION public.is_valid_share_token(token TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.showing_sessions WHERE share_token = token
  );
$$;

-- =====================================================
-- ENABLE RLS
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_ratings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - PROFILES
-- =====================================================

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES - SHOWING SESSIONS
-- =====================================================

CREATE POLICY "Admins can view their own sessions"
  ON public.showing_sessions FOR SELECT
  USING (admin_id = auth.uid());

CREATE POLICY "Public can view sessions via share token"
  ON public.showing_sessions FOR SELECT
  USING (share_token IS NOT NULL);

CREATE POLICY "Admins can create sessions"
  ON public.showing_sessions FOR INSERT
  WITH CHECK (admin_id = auth.uid());

CREATE POLICY "Admins can update their own sessions"
  ON public.showing_sessions FOR UPDATE
  USING (admin_id = auth.uid());

CREATE POLICY "Admins can delete their own sessions"
  ON public.showing_sessions FOR DELETE
  USING (admin_id = auth.uid());

-- =====================================================
-- RLS POLICIES - SESSION PROPERTIES
-- =====================================================

CREATE POLICY "Admins can view their session properties"
  ON public.session_properties FOR SELECT
  USING (public.is_session_admin(session_id));

CREATE POLICY "Public can view session properties"
  ON public.session_properties FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.showing_sessions 
    WHERE id = session_id AND share_token IS NOT NULL
  ));

CREATE POLICY "Admins can create session properties"
  ON public.session_properties FOR INSERT
  WITH CHECK (public.is_session_admin(session_id));

CREATE POLICY "Admins can update session properties"
  ON public.session_properties FOR UPDATE
  USING (public.is_session_admin(session_id));

CREATE POLICY "Admins can delete session properties"
  ON public.session_properties FOR DELETE
  USING (public.is_session_admin(session_id));

-- =====================================================
-- RLS POLICIES - PROPERTY DOCUMENTS
-- =====================================================

CREATE POLICY "Admins can view their property documents"
  ON public.property_documents FOR SELECT
  USING (public.is_session_admin(public.get_session_id_from_property(session_property_id)));

CREATE POLICY "Public can view property documents"
  ON public.property_documents FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.session_properties sp
    JOIN public.showing_sessions ss ON ss.id = sp.session_id
    WHERE sp.id = session_property_id AND ss.share_token IS NOT NULL
  ));

CREATE POLICY "Admins can create property documents"
  ON public.property_documents FOR INSERT
  WITH CHECK (public.is_session_admin(public.get_session_id_from_property(session_property_id)));

CREATE POLICY "Admins can update property documents"
  ON public.property_documents FOR UPDATE
  USING (public.is_session_admin(public.get_session_id_from_property(session_property_id)));

CREATE POLICY "Admins can delete property documents"
  ON public.property_documents FOR DELETE
  USING (public.is_session_admin(public.get_session_id_from_property(session_property_id)));

-- =====================================================
-- RLS POLICIES - PROPERTY RATINGS (Public can add)
-- =====================================================

CREATE POLICY "Anyone can view property ratings"
  ON public.property_ratings FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create property ratings"
  ON public.property_ratings FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_showing_sessions_updated_at
  BEFORE UPDATE ON public.showing_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_session_properties_updated_at
  BEFORE UPDATE ON public.session_properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TRIGGER: Auto-create profile on user signup
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_showing_sessions_admin_id ON public.showing_sessions(admin_id);
CREATE INDEX idx_showing_sessions_share_token ON public.showing_sessions(share_token);
CREATE INDEX idx_session_properties_session_id ON public.session_properties(session_id);
CREATE INDEX idx_session_properties_order ON public.session_properties(session_id, order_index);
CREATE INDEX idx_property_documents_property_id ON public.property_documents(session_property_id);
CREATE INDEX idx_property_ratings_property_id ON public.property_ratings(session_property_id);