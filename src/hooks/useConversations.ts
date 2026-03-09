import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef } from "react";

export function useConversations(status?: string, chatType?: string) {
  const queryClient = useQueryClient();
  const realtimeFailed = useRef(false);

  const query = useQuery({
    queryKey: ["conversations", status, chatType],
    queryFn: async () => {
      let q = supabase
        .from("conversations")
        .select("*, contacts(name, phone, tags), instances(name)")
        .order("last_message_at", { ascending: false, nullsFirst: false });
      if (status) q = q.eq("status", status as "open" | "closed" | "pending" | "bot");
      if (chatType) q = q.eq("chat_type", chatType);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("conversations-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          realtimeFailed.current = true;
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const markAsRead = async (conversationId: string) => {
    await supabase
      .from("conversations")
      .update({ unread_count: 0 })
      .eq("id", conversationId);
  };

  const deleteConversation = async (conversationId: string) => {
    const { error: msgError } = await supabase.from("messages").delete().eq("conversation_id", conversationId);
    if (msgError) throw msgError;
    const { error } = await supabase.from("conversations").delete().eq("id", conversationId);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  };

  return { ...query, markAsRead, deleteConversation };
}

export function useMessages(conversationId: string | null) {
  const queryClient = useQueryClient();
  const realtimeFailed = useRef(false);

  const query = useQuery({
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
    refetchInterval: realtimeFailed.current ? 5000 : false,
  });

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          realtimeFailed.current = true;
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return query;
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
