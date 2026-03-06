
-- Enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'supervisor', 'atendente');

-- Enum for instance status
CREATE TYPE public.instance_status AS ENUM ('connected', 'disconnected', 'connecting', 'qr_pending');

-- Enum for conversation status
CREATE TYPE public.conversation_status AS ENUM ('open', 'closed', 'pending', 'bot');

-- Enum for message direction
CREATE TYPE public.message_direction AS ENUM ('inbound', 'outbound');

-- Enum for message status
CREATE TYPE public.message_status AS ENUM ('pending', 'sent', 'delivered', 'read', 'failed');

-- Enum for campaign status
CREATE TYPE public.campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'paused', 'completed', 'cancelled');

-- Enum for automation trigger type
CREATE TYPE public.trigger_type AS ENUM ('keyword', 'first_message', 'schedule', 'webhook');

-- Function: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Table: profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Table: instances
CREATE TABLE public.instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  status instance_status NOT NULL DEFAULT 'disconnected',
  api_url TEXT,
  session_data JSONB,
  qr_code TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view instances" ON public.instances FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage instances" ON public.instances FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert instances" ON public.instances FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_instances_updated_at BEFORE UPDATE ON public.instances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: contacts
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  instance_id UUID REFERENCES public.instances(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view contacts" ON public.contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert contacts" ON public.contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update contacts" ON public.contacts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete contacts" ON public.contacts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_contacts_phone ON public.contacts(phone);
CREATE INDEX idx_contacts_tags ON public.contacts USING GIN(tags);
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: conversations
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  instance_id UUID NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  status conversation_status NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id),
  department TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  unread_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view conversations" ON public.conversations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update conversations" ON public.conversations FOR UPDATE TO authenticated USING (true);
CREATE INDEX idx_conversations_contact ON public.conversations(contact_id);
CREATE INDEX idx_conversations_instance ON public.conversations(instance_id);
CREATE INDEX idx_conversations_status ON public.conversations(status);
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  direction message_direction NOT NULL,
  status message_status NOT NULL DEFAULT 'pending',
  sender_name TEXT,
  external_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view messages" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update messages" ON public.messages FOR UPDATE TO authenticated USING (true);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- Table: automation_flows
CREATE TABLE public.automation_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type trigger_type NOT NULL DEFAULT 'keyword',
  trigger_value TEXT,
  blocks JSONB DEFAULT '[]',
  active BOOLEAN DEFAULT false,
  instance_ids UUID[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.automation_flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view flows" ON public.automation_flows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins supervisors can manage flows" ON public.automation_flows FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));
CREATE POLICY "Admins supervisors can insert flows" ON public.automation_flows FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));
CREATE TRIGGER update_automation_flows_updated_at BEFORE UPDATE ON public.automation_flows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: campaigns
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status campaign_status NOT NULL DEFAULT 'draft',
  template TEXT,
  template_variables JSONB DEFAULT '{}',
  recipient_tags TEXT[] DEFAULT '{}',
  recipient_count INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  read_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  delay_ms INT DEFAULT 3000,
  instance_id UUID REFERENCES public.instances(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view campaigns" ON public.campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins supervisors can manage campaigns" ON public.campaigns FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));
CREATE POLICY "Admins supervisors can insert campaigns" ON public.campaigns FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: campaign_messages
CREATE TABLE public.campaign_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  status message_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error TEXT
);
ALTER TABLE public.campaign_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view campaign messages" ON public.campaign_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage campaign messages" ON public.campaign_messages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_campaign_messages_campaign ON public.campaign_messages(campaign_id);

-- Table: settings
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view settings" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage settings" ON public.settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert settings" ON public.settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Table: quick_replies
CREATE TABLE public.quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  shortcut TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quick_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view quick replies" ON public.quick_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert quick replies" ON public.quick_replies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update quick replies" ON public.quick_replies FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete quick replies" ON public.quick_replies FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
