import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ContactAvatar } from "./ContactAvatar";
import { X, Phone, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { ConversationItem } from "./ConversationList";

interface RightPanelProps {
  conversation: ConversationItem;
  onClose: () => void;
}

function formatPhone(phone: string) {
  // Detect LID identifiers (very long numbers or non-standard formats)
  if (phone.length > 15 || !/^\d{10,15}$/.test(phone)) {
    return phone;
  }
  if (phone.length >= 12) {
    return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
  }
  return phone;
}

export function RightPanel({ conversation, onClose }: RightPanelProps) {
  const contactName = conversation.contacts?.name || "Desconhecido";
  const contactPhone = conversation.contacts?.phone || "";
  const contactTags = conversation.contacts?.tags || [];

  return (
    <div className="w-[340px] border-l border-border/60 bg-background flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between bg-card/80 backdrop-blur-sm">
        <span className="text-sm font-semibold text-foreground">Detalhes do Contato</span>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {/* Contact Card */}
          <div className="bg-secondary/40 rounded-2xl p-5 flex flex-col items-center text-center">
            <ContactAvatar name={contactName} size="xl" />
            <h2 className="mt-3 font-bold text-base text-foreground">{contactName}</h2>
            {contactPhone && (
              <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span className="text-xs">{formatPhone(contactPhone)}</span>
              </div>
            )}
            {conversation.instances?.name && (
              <div className="flex items-center gap-1.5 mt-1.5 text-muted-foreground">
                <span className="text-xs">{conversation.instances.name}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-1.5 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span className="text-xs">
                Desde {format(new Date(conversation.created_at), "dd/MM/yyyy")}
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="bg-secondary/40 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">Status</span>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="rounded-full capitalize">
                {conversation.status}
              </Badge>
              {conversation.department && (
                <Badge variant="secondary" className="rounded-full">
                  {conversation.department}
                </Badge>
              )}
            </div>
          </div>

          {/* Tags */}
          {contactTags.length > 0 && (
            <div className="bg-secondary/40 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">Tags</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {contactTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-[11px] rounded-full px-3 py-1 font-medium bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
