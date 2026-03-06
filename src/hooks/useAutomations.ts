import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Flow = Database["public"]["Tables"]["automation_flows"]["Row"];
type FlowInsert = Database["public"]["Tables"]["automation_flows"]["Insert"];

export function useAutomations() {
  return useQuery({
    queryKey: ["automations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("automation_flows").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Flow[];
    },
  });
}

export function useCreateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (flow: FlowInsert) => {
      const { data, error } = await supabase.from("automation_flows").insert(flow).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automations"] }),
  });
}

export function useToggleAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("automation_flows").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automations"] }),
  });
}
