import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Send, Paperclip, Smile, MoreVertical, Phone, User } from "lucide-react";
import { useConversations, useMessages, useSendMessage } from "@/hooks/useConversations";
import { Skeleton } from "@/components/ui/skeleton";

const Chat = () => {
  const { data: conversations, isLoading: loadingConvs } = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: messages, isLoading: loadingMsgs } = useMessages(selectedId);
  const sendMessage = useSendMessage();
  const [msg, setMsg] = useState("");

  const selected = conversations?.find((c) => c.id === selectedId);

  const handleSend = async () => {
    if (!msg.trim() || !selectedId) return;
    await sendMessage.mutateAsync({ conversation_id: selectedId, content: msg, direction: "outbound" });
    setMsg("");
  };

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      {/* Conversation list */}
      <div className="w-80 border-r border-border flex flex-col bg-card/30 shrink-0">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar conversa..." className="pl-9 bg-secondary/50 border-0 h-9" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {loadingConvs ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 m-2" />)
          ) : conversations?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma conversa</p>
          ) : (
            conversations?.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`flex items-center gap-3 p-3 cursor-pointer border-b border-border/50 transition-colors hover:bg-secondary/30 ${
                  selectedId === conv.id ? "bg-secondary/50" : ""
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground truncate">{(conv as any).contacts?.name || "Desconhecido"}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-muted-foreground truncate">{conv.last_message_preview || "Sem mensagens"}</p>
                    <div className="flex items-center gap-1.5">
                      {conv.department && <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary/30 text-primary">{conv.department}</Badge>}
                      {(conv.unread_count ?? 0) > 0 && (
                        <span className="h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>Selecione uma conversa para começar</p>
          </div>
        ) : (
          <>
            <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/30">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{(selected as any)?.contacts?.name || "Contato"}</p>
                  <p className="text-[11px] text-muted-foreground">{selected?.department || "Geral"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3 max-w-2xl mx-auto">
                {loadingMsgs ? (
                  Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className={`h-12 ${i % 2 === 0 ? "w-2/3" : "w-1/2 ml-auto"}`} />)
                ) : messages?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma mensagem</p>
                ) : (
                  messages?.map((m) => (
                    <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        m.direction === "outbound"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-secondary text-secondary-foreground rounded-bl-sm"
                      }`}>
                        <p className="text-sm">{m.content}</p>
                        <p className={`text-[10px] mt-1 ${m.direction === "outbound" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="p-3 border-t border-border bg-card/30">
              <div className="flex items-center gap-2 max-w-2xl mx-auto">
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0"><Smile className="h-5 w-5" /></Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0"><Paperclip className="h-5 w-5" /></Button>
                <Input
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Digite uma mensagem..."
                  className="bg-secondary/50 border-0 h-9"
                />
                <Button size="icon" className="h-9 w-9 shrink-0 rounded-full" onClick={handleSend}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;
