
-- Temporarily allow anon/authenticated inserts, updates, deletes on automation_flows until auth is implemented
CREATE POLICY "Temp allow all inserts on automation_flows"
  ON public.automation_flows FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Temp allow all updates on automation_flows"
  ON public.automation_flows FOR UPDATE
  USING (true);

CREATE POLICY "Temp allow all deletes on automation_flows"
  ON public.automation_flows FOR DELETE
  USING (true);
