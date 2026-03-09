import { useState, useEffect } from "react";
import { useConversations, useMessages, useSendMessage } from "@/hooks/useConversations";
import { useToast } from "@/hooks/use-toast";
import { ConversationList, type ConversationItem } from "@/components/conversations/ConversationList";
import { ChatPanel } from "@/components/conversations/ChatPanel";
import { RightPanel } from "@/components/conversations/RightPanel";

const Chat = () => {
  const [chatType, setChatType] = useState("private");
  const { data: conversations, isLoading: loadingConvs, markAsRead, deleteConversation } = useConversations(undefined, chatType);
  const [selected, setSelected] = useState<ConversationItem | null>(null);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const { data: messages, isLoading: loadingMsgs } = useMessages(selected?.id || null);
  const sendMessage = useSendMessage();
  const { toast } = useToast();

  useEffect(() => {
    if (selected && (selected.unread_count ?? 0) > 0) {
      markAsRead(selected.id);
    }
  }, [selected]);

  const handleSend = async (msg: string) => {
    if (!selected) return;
    try {
      await sendMessage.mutateAsync({
        conversation_id: selected.id,
        content: msg,
        direction: "outbound",
      });
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (conv: ConversationItem) => {
    try {
      if (selected?.id === conv.id) setSelected(null);
      await deleteConversation(conv.id);
      toast({ title: "Conversa excluída" });
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="h-full flex">
      {/* Left - Conversation List */}
      <div className="w-80 lg:w-96 shrink-0 border-r border-border">
        <ConversationList
          conversations={conversations as ConversationItem[] | undefined}
          isLoading={loadingConvs}
          selected={selected}
          onSelect={(conv) => setSelected(conv)}
          onDelete={handleDelete}
        />
      </div>

      {/* Center - Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatPanel
          conversation={selected}
          messages={messages}
          isLoading={loadingMsgs}
          onSend={handleSend}
          isSending={sendMessage.isPending}
          onToggleRightPanel={() => setShowRightPanel(p => !p)}
          showRightPanel={showRightPanel}
        />
      </div>

      {/* Right - Details Panel */}
      {showRightPanel && selected && (
        <RightPanel
          conversation={selected}
          onClose={() => setShowRightPanel(false)}
        />
      )}
    </div>
  );
};

export default Chat;
