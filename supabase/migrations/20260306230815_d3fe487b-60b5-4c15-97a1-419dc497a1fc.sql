
-- Drop restrictive policies that block anon access
DROP POLICY IF EXISTS "Admins supervisors can insert flows" ON public.automation_flows;
DROP POLICY IF EXISTS "Admins supervisors can manage flows" ON public.automation_flows;
