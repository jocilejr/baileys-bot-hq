
DROP POLICY IF EXISTS "Authenticated users can view flows" ON public.automation_flows;
CREATE POLICY "Anyone can view flows" ON public.automation_flows FOR SELECT USING (true);
