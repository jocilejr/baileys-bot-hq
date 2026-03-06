import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useConversations(status?: string) {
  return useQuery({
    queryKey: ["conversations", status],
    queryFn: async () => {
      let query = supabase
        .from("conversations")
        .select("*, contacts(name, phone, tags), instances(name)")
        .order("last_message_at", { ascending: false, nullsFirst: false });
      if (status) query = query.eq("status", status);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["messages", conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (msg: { conversation_id: string; content: string; direction: "outbound" | "inbound" }) => {
      const { data, error } = await supabase.from("messages").insert({
        conversation_id: msg.conversation_id,
        content: msg.content,
        direction: msg.direction,
        status: "sent",
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["messages", vars.conversation_id] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
