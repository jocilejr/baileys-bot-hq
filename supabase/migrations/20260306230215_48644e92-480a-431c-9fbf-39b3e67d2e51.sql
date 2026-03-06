
ALTER TABLE public.automation_flows
  ADD COLUMN IF NOT EXISTS nodes jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS edges jsonb DEFAULT '[]'::jsonb;
