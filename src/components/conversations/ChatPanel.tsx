import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  MessageSquare, Send, Loader2, Check, CheckCheck,
  PanelRight, X,
} from "lucide-react";
import { ContactAvatar } from "./ContactAvatar";
import { WhatsAppAudioPlayer } from "./WhatsAppAudioPlayer";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { ConversationItem } from "./ConversationList";

interface Message {
  id: string;
  conversation_id: string;
  content: string | null;
  direction: string;
  status: string;
  media_url: string | null;
  media_type: string | null;
  sender_name: string | null;
  external_id: string | null;
  created_at: string;
}

interface ChatPanelProps {
  conversation: ConversationItem | null;
  messages: Message[] | undefined;
  isLoading: boolean;
  onSend: (text: string) => Promise<void>;
  isSending: boolean;
  onToggleRightPanel: () => void;
  showRightPanel: boolean;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "failed") {
    return <X className="h-3 w-3 text-red-500" />;
  }
  if (status === "delivered" || status === "read") {
    return <CheckCheck className={cn("h-3 w-3", status === "read" ? "text-info" : "text-white/40")} />;
  }
  if (status === "pending") {
    return <Loader2 className="h-3 w-3 text-white/40 animate-spin" />;
  }
  return <Check className="h-3 w-3 text-white/40" />;
}

export function ChatPanel({
  conversation, messages, isLoading, onSend, isSending,
  onToggleRightPanel, showRightPanel,
}: ChatPanelProps) {
  const [text, setText] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const contactName = conversation?.contacts?.name || "Contato";

  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const msg = text;
    setText("");
    await onSend(msg);
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-20 w-20 rounded-2xl bg-secondary/80 flex items-center justify-center mx-auto">
            <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-lg">Suas conversas</p>
            <p className="text-sm text-muted-foreground mt-1">
              Selecione uma conversa para começar
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Image Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center cursor-pointer"
          onClick={() => setLightboxUrl(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/10 z-10"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="h-6 w-6" />
          </Button>
          <img
            src={lightboxUrl}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3 border-b border-border/60 flex items-center gap-3 bg-card/80 backdrop-blur-sm">
        <ContactAvatar name={contactName} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate text-foreground">{contactName}</p>
          <p className="text-xs text-muted-foreground">
            {conversation.contacts?.phone || conversation.department || "Geral"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-full",
            showRightPanel && "bg-primary/10 text-primary"
          )}
          onClick={onToggleRightPanel}
        >
          <PanelRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1 chat-bg-pattern">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !messages?.length ? (
          <p className="text-center text-sm text-muted-foreground py-12">Nenhuma mensagem ainda</p>
        ) : (
          messages.map((msg, idx) => {
            const isOutbound = msg.direction === "outbound";
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const showTimeSeparator =
              !prevMsg ||
              format(new Date(msg.created_at), "dd/MM/yyyy") !==
                format(new Date(prevMsg.created_at), "dd/MM/yyyy");

            return (
              <div key={msg.id}>
                {showTimeSeparator && (
                  <div className="flex justify-center my-4">
                    <span className="text-[11px] text-foreground/80 bg-card/90 backdrop-blur-sm px-4 py-1.5 rounded-lg font-medium shadow-sm">
                      {format(new Date(msg.created_at), "dd/MM/yyyy")}
                    </span>
                  </div>
                )}
                <div className={cn("flex mb-1", isOutbound ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] text-sm shadow-sm",
                      msg.media_type === "audio" ? "px-2 py-1.5" : "px-4 py-2.5",
                      isOutbound
                        ? "bg-[#075e54] text-white rounded-2xl rounded-br-sm"
                        : "bg-[#1f2c34] text-white rounded-2xl rounded-bl-sm"
                    )}
                  >
                    {msg.media_url && (
                      <div className={cn("mb-2", !msg.content && "-mx-1 -mt-1")}>
                        {msg.media_type === "image" ? (
                          <img
                            src={msg.media_url}
                            alt=""
                            className="rounded-xl max-w-[360px] max-h-[360px] w-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            loading="lazy"
                            onClick={() => setLightboxUrl(msg.media_url!)}
                          />
                        ) : msg.media_type === "audio" ? (
                          <WhatsAppAudioPlayer
                            src={msg.media_url}
                            isOutbound={isOutbound}
                            contactName={!isOutbound ? contactName : undefined}
                            timestamp={format(new Date(msg.created_at), "HH:mm")}
                          />
                        ) : msg.media_type === "video" ? (
                          <video
                            controls
                            src={msg.media_url}
                            className="rounded-xl max-w-[360px] max-h-[360px]"
                            preload="metadata"
                          />
                        ) : msg.media_type === "document" ? (
                          <a
                            href={msg.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs"
                          >
                            Documento anexado
                          </a>
                        ) : null}
                      </div>
                    )}
                    {msg.content && <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>}
                    {msg.media_type !== "audio" && (
                      <div className={cn(
                        "flex items-center gap-1 justify-end mt-1",
                        isOutbound ? "text-white/50" : "text-muted-foreground/60"
                      )}>
                        <span className="text-[10px]">{format(new Date(msg.created_at), "HH:mm")}</span>
                        {isOutbound && <StatusIcon status={msg.status} />}
                      </div>
                    )}
                    {msg.media_type === "audio" && isOutbound && (
                      <div className="flex items-center gap-1 justify-end -mt-1">
                        <StatusIcon status={msg.status} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-border/60 bg-card/60 backdrop-blur-sm flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Digite uma mensagem..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) handleSend();
            }}
            className="h-10 bg-secondary/50 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full px-4 text-sm"
          />
        </div>
        <Button
          size="icon"
          className="h-9 w-9 rounded-full shrink-0 shadow-sm"
          onClick={handleSend}
          disabled={!text.trim() || isSending}
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
