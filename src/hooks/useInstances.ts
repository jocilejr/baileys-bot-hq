import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Instance = Database["public"]["Tables"]["instances"]["Row"];
type InstanceInsert = Database["public"]["Tables"]["instances"]["Insert"];

export function useInstances() {
  return useQuery({
    queryKey: ["instances"],
    queryFn: async () => {
      const { data, error } = await supabase.from("instances").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Instance[];
    },
  });
}

export function useCreateInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (instance: InstanceInsert) => {
      const { data, error } = await supabase.from("instances").insert(instance).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["instances"] }),
  });
}

export function useDeleteInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("instances").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["instances"] }),
  });
}

export function useUpdateInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Instance> & { id: string }) => {
      const { data, error } = await supabase.from("instances").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["instances"] }),
  });
}

export function useBaileysProxy() {
  return useMutation({
    mutationFn: async (payload: { action: string; instanceId?: string; data?: Record<string, unknown> }) => {
      const { data, error } = await supabase.functions.invoke("baileys-proxy", { body: payload });
      if (error) throw error;
      return data;
    },
  });
}
