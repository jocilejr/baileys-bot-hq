import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FlowHistoryEntry {
  id: string;
  flow_id: string;
  name: string;
  nodes: any[];
  edges: any[];
  created_at: string;
}

export function useFlowHistory(flowId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["flow-history", flowId],
    enabled: !!flowId,
    queryFn: async () => {
      // Flow history table may not exist yet - return empty array on error
      try {
        const { data, error } = await supabase
          .from("chatbot_flow_history" as any)
          .select("*")
          .eq("flow_id", flowId)
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) return [] as FlowHistoryEntry[];
        return data as unknown as FlowHistoryEntry[];
      } catch {
        return [] as FlowHistoryEntry[];
      }
    },
  });

  const saveSnapshot = useMutation({
    mutationFn: async ({ name, nodes, edges }: { name: string; nodes: any[]; edges: any[] }) => {
      try {
        await supabase
          .from("chatbot_flow_history" as any)
          .insert({
            flow_id: flowId,
            name,
            nodes,
            edges,
          } as any);
      } catch {
        // Silently fail if table doesn't exist
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["flow-history", flowId] }),
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase
          .from("chatbot_flow_history" as any)
          .delete()
          .eq("id", id);
      } catch {
        // Silently fail
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["flow-history", flowId] }),
  });

  return { ...query, saveSnapshot, deleteEntry };
}
