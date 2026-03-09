-- ============================================
-- ZapManager — Database Migration (Idempotent)
-- ============================================

-- ==================
-- ENUMS
-- ==================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'supervisor', 'atendente');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'instance_status') THEN
    CREATE TYPE public.instance_status AS ENUM ('connected', 'disconnected', 'connecting', 'qr_pending');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_status') THEN
    CREATE TYPE public.conversation_status AS ENUM ('open', 'closed', 'pending', 'bot');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_status') THEN
    CREATE TYPE public.message_status AS ENUM ('pending', 'sent', 'delivered', 'read', 'failed');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_direction') THEN
    CREATE TYPE public.message_direction AS ENUM ('inbound', 'outbound');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_status') THEN
    CREATE TYPE public.campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'paused', 'completed', 'cancelled');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trigger_type') THEN
    CREATE TYPE public.trigger_type AS ENUM ('keyword', 'first_message', 'schedule', 'webhook');
  END IF;
END $$;

-- ==================
-- FUNCTIONS
-- ==================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$;

-- ==================
-- TABLES
-- ==================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  api_url text,
  qr_code text,
  status instance_status NOT NULL DEFAULT 'disconnected',
  session_data jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  tags text[] DEFAULT '{}',
  notes text,
  custom_fields jsonb DEFAULT '{}',
  instance_id uuid REFERENCES public.instances(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  instance_id uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  status conversation_status NOT NULL DEFAULT 'open',
  assigned_to uuid,
  last_message_at timestamptz,
  last_message_preview text,
  unread_count integer DEFAULT 0,
  department text,
  chat_type text NOT NULL DEFAULT 'private',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  direction message_direction NOT NULL,
  content text,
  media_url text,
  media_type text,
  sender_name text,
  external_id text,
  status message_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template text,
  template_variables jsonb DEFAULT '{}',
  status campaign_status NOT NULL DEFAULT 'draft',
  instance_id uuid REFERENCES public.instances(id) ON DELETE SET NULL,
  recipient_tags text[] DEFAULT '{}',
  recipient_count integer DEFAULT 0,
  sent_count integer DEFAULT 0,
  delivered_count integer DEFAULT 0,
  read_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  delay_ms integer DEFAULT 3000,
  scheduled_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campaign_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  status message_status NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  error text
);

CREATE TABLE IF NOT EXISTS public.automation_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trigger_type trigger_type NOT NULL DEFAULT 'keyword',
  trigger_value text,
  active boolean DEFAULT false,
  instance_ids uuid[] DEFAULT '{}',
  blocks jsonb DEFAULT '[]',
  nodes jsonb DEFAULT '[]',
  edges jsonb DEFAULT '[]',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quick_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  shortcut text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}',
  description text,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==================
-- ENABLE RLS
-- ==================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- ==================
-- RLS POLICIES
-- ==================

-- user_roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- instances
DROP POLICY IF EXISTS "Authenticated users can view instances" ON public.instances;
CREATE POLICY "Authenticated users can view instances" ON public.instances FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert instances" ON public.instances;
CREATE POLICY "Admins can insert instances" ON public.instances FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage instances" ON public.instances;
CREATE POLICY "Admins can manage instances" ON public.instances FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- contacts
DROP POLICY IF EXISTS "Authenticated users can view contacts" ON public.contacts;
CREATE POLICY "Authenticated users can view contacts" ON public.contacts FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert contacts" ON public.contacts;
CREATE POLICY "Authenticated users can insert contacts" ON public.contacts FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update contacts" ON public.contacts;
CREATE POLICY "Authenticated users can update contacts" ON public.contacts FOR UPDATE TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can delete contacts" ON public.contacts;
CREATE POLICY "Admins can delete contacts" ON public.contacts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- conversations
DROP POLICY IF EXISTS "Authenticated users can view conversations" ON public.conversations;
CREATE POLICY "Authenticated users can view conversations" ON public.conversations FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert conversations" ON public.conversations;
CREATE POLICY "Authenticated users can insert conversations" ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update conversations" ON public.conversations;
CREATE POLICY "Authenticated users can update conversations" ON public.conversations FOR UPDATE TO authenticated
  USING (true);

-- messages
DROP POLICY IF EXISTS "Authenticated users can view messages" ON public.messages;
CREATE POLICY "Authenticated users can view messages" ON public.messages FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.messages;
CREATE POLICY "Authenticated users can insert messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update messages" ON public.messages;
CREATE POLICY "Authenticated users can update messages" ON public.messages FOR UPDATE TO authenticated
  USING (true);

-- campaigns
DROP POLICY IF EXISTS "Authenticated users can view campaigns" ON public.campaigns;
CREATE POLICY "Authenticated users can view campaigns" ON public.campaigns FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins supervisors can insert campaigns" ON public.campaigns;
CREATE POLICY "Admins supervisors can insert campaigns" ON public.campaigns FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));

DROP POLICY IF EXISTS "Admins supervisors can manage campaigns" ON public.campaigns;
CREATE POLICY "Admins supervisors can manage campaigns" ON public.campaigns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));

-- campaign_messages
DROP POLICY IF EXISTS "Authenticated users can view campaign messages" ON public.campaign_messages;
CREATE POLICY "Authenticated users can view campaign messages" ON public.campaign_messages FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage campaign messages" ON public.campaign_messages;
CREATE POLICY "Admins can manage campaign messages" ON public.campaign_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- automation_flows
DROP POLICY IF EXISTS "Anyone can view flows" ON public.automation_flows;
CREATE POLICY "Anyone can view flows" ON public.automation_flows FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can insert flows" ON public.automation_flows;
CREATE POLICY "Authenticated can insert flows" ON public.automation_flows FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can update flows" ON public.automation_flows;
CREATE POLICY "Authenticated can update flows" ON public.automation_flows FOR UPDATE TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can delete flows" ON public.automation_flows;
CREATE POLICY "Authenticated can delete flows" ON public.automation_flows FOR DELETE TO authenticated
  USING (true);

-- quick_replies
DROP POLICY IF EXISTS "Authenticated users can view quick replies" ON public.quick_replies;
CREATE POLICY "Authenticated users can view quick replies" ON public.quick_replies FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert quick replies" ON public.quick_replies;
CREATE POLICY "Authenticated users can insert quick replies" ON public.quick_replies FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update quick replies" ON public.quick_replies;
CREATE POLICY "Authenticated users can update quick replies" ON public.quick_replies FOR UPDATE TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can delete quick replies" ON public.quick_replies;
CREATE POLICY "Admins can delete quick replies" ON public.quick_replies FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- settings
DROP POLICY IF EXISTS "Authenticated users can view settings" ON public.settings;
CREATE POLICY "Authenticated users can view settings" ON public.settings FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert settings" ON public.settings;
CREATE POLICY "Admins can insert settings" ON public.settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;
CREATE POLICY "Admins can manage settings" ON public.settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ==================
-- TRIGGERS (updated_at)
-- ==================

DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.instances;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.instances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.contacts;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.conversations;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.campaigns;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.automation_flows;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.automation_flows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON public.settings;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for new user -> profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==================
-- STORAGE BUCKET
-- ==================

INSERT INTO storage.buckets (id, name, public)
VALUES ('automation-media', 'automation-media', true)
ON CONFLICT (id) DO NOTHING;

-- ==================
-- REALTIME
-- ==================

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.instances;

-- Done
