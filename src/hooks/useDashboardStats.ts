import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [conversations, messages, contacts, instances] = await Promise.all([
        supabase.from("conversations").select("id, status", { count: "exact" }).eq("status", "open"),
        supabase.from("messages").select("id", { count: "exact" }).gte("created_at", new Date(Date.now() - 86400000).toISOString()),
        supabase.from("contacts").select("id", { count: "exact" }),
        supabase.from("instances").select("*"),
      ]);

      return {
        activeConversations: conversations.count || 0,
        messagesToday: messages.count || 0,
        totalContacts: contacts.count || 0,
        instances: instances.data || [],
      };
    },
  });
}
