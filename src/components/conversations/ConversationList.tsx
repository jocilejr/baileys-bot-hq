import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, Search, MessageSquare, Trash2, Users } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ContactAvatar } from "./ContactAvatar";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";

export interface ConversationItem {
  id: string;
  contact_id: string;
  instance_id: string;
  status: string;
  assigned_to: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number | null;
  department: string | null;
  chat_type: string;
  created_at: string;
  updated_at: string;
  contacts?: { name: string; phone: string; tags: string[] | null } | null;
  instances?: { name: string } | null;
}

interface ConversationListProps {
  conversations: ConversationItem[] | undefined;
  isLoading: boolean;
  selected: ConversationItem | null;
  onSelect: (conv: ConversationItem) => void;
  onDelete: (conv: ConversationItem) => void;
  onSync?: () => void;
  isSyncing?: boolean;
  chatType: string;
  onChatTypeChange: (type: string) => void;
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Ontem";
  return format(d, "dd/MM/yy");
}

export function ConversationList({
  conversations,
  isLoading,
  selected,
  onSelect,
  onDelete,
  onSync,
  isSyncing,
}: ConversationListProps) {
  const [search, setSearch] = useState("");

  const filtered = conversations?.filter((c) => {
    const name = c.contacts?.name || "";
    const phone = c.contacts?.phone || "";
    return name.toLowerCase().includes(search.toLowerCase()) || phone.includes(search);
  });

  return (
    <div className="flex flex-col h-full bg-card/50">
      <div className="px-4 pt-3 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground tracking-tight">Conversas</h2>
          {onSync && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary"
              onClick={onSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-10 rounded-full bg-secondary/60 border-0 focus-visible:ring-1 focus-visible:ring-ring text-sm placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !filtered?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3">
              <MessageSquare className="h-5 w-5 opacity-50" />
            </div>
            <span className="text-sm font-medium">Nenhuma conversa</span>
            <span className="text-xs mt-1 opacity-60">As conversas aparecerão aqui</span>
          </div>
        ) : (
          <div className="px-1.5 pb-2">
            {filtered.map((conv, index) => {
              const isSelected = selected?.id === conv.id;
              const hasUnread = (conv.unread_count ?? 0) > 0;
              const contactName = conv.contacts?.name || "Desconhecido";

              return (
                <div key={conv.id}>
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <button
                        onClick={() => onSelect(conv)}
                        className={cn(
                          "w-full text-left px-3 py-3 transition-all duration-150 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl",
                          isSelected
                            ? "bg-primary/10 shadow-sm"
                            : "hover:bg-secondary/70"
                        )}
                      >
                        <ContactAvatar name={contactName} size="md" />

                        <div className="min-w-0 overflow-hidden">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={cn(
                              "text-sm truncate",
                              hasUnread ? "font-semibold text-foreground" : "font-medium text-foreground/80"
                            )}>
                              {contactName}
                            </span>
                            {conv.instances?.name && (
                              <span className="text-[9px] font-medium text-muted-foreground/60 bg-secondary/80 px-1.5 py-0.5 rounded truncate">
                                {conv.instances.name}
                              </span>
                            )}
                          </div>
                          <p className={cn(
                            "text-xs truncate mt-1",
                            hasUnread ? "text-foreground/70 font-medium" : "text-muted-foreground"
                          )}>
                            {conv.last_message_preview || "..."}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className={cn(
                            "text-[10px] whitespace-nowrap",
                            hasUnread ? "text-primary font-semibold" : "text-muted-foreground"
                          )}>
                            {formatTime(conv.last_message_at)}
                          </span>
                          {hasUnread && (
                            <span className="flex items-center justify-center h-[18px] min-w-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                              {(conv.unread_count ?? 0) > 99 ? "99+" : conv.unread_count}
                            </span>
                          )}
                        </div>
                      </button>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete(conv)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir conversa
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                  {index < (filtered?.length || 0) - 1 && (
                    <div className="mx-14 border-b border-border/30" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
