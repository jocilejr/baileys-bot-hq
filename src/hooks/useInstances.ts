import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { apiClient } from "@/lib/api";
import type { Database } from "@/integrations/supabase/types";

type Instance = Database["public"]["Tables"]["instances"]["Row"];

export function useInstances() {
  return useQuery({
    queryKey: ["instances"],
    queryFn: async () => {
      const { data, error } = await supabase.from("instances").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Instance[];
    },
    refetchInterval: 3000,
  });
}

export function useRealtimeInstances() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("instances-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "instances" },
        () => {
          qc.invalidateQueries({ queryKey: ["instances"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}

export function useCreateInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      return apiClient.post("/instances", { name });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["instances"] }),
  });
}

export function useDeleteInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/instances/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["instances"] }),
  });
}

export function useReconnectInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.post(`/instances/${id}/reconnect`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["instances"] }),
  });
}

export function useInstanceStatus(id: string | null) {
  return useQuery({
    queryKey: ["instance-status", id],
    queryFn: async () => {
      if (!id) return null;
      return apiClient.get(`/instances/${id}/status`);
    },
    enabled: !!id,
    refetchInterval: 5000,
  });
}

export function useBackendHealth() {
  return useQuery({
    queryKey: ["backend-health"],
    queryFn: async () => {
      return apiClient.get("/health");
    },
    refetchInterval: 10000,
    retry: 1,
  });
}

export function useSendMessage() {
  return useMutation({
    mutationFn: async (payload: { instanceId: string; conversationId?: string; to: string; content?: string; mediaUrl?: string; mediaType?: string }) => {
      return apiClient.post("/messages/send", payload);
    },
  });
}
