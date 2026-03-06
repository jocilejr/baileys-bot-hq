import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { FlowNode, FlowEdge } from "@/types/chatbot";

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

export function useAutomation(id: string | null) {
  return useQuery({
    queryKey: ["automation", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("automation_flows").select("*").eq("id", id!).single();
      if (error) throw error;
      return data as Flow;
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

export function useUpdateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, nodes, edges }: { id: string; name: string; nodes: FlowNode[]; edges: FlowEdge[] }) => {
      const { error } = await supabase
        .from("automation_flows")
        .update({ name, nodes: nodes as any, edges: edges as any })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["automations"] });
      qc.invalidateQueries({ queryKey: ["automation", vars.id] });
    },
  });
}

export function useDeleteAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("automation_flows").delete().eq("id", id);
      if (error) throw error;
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
