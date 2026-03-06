import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Send, Paperclip, Smile, MoreVertical, Phone, User } from "lucide-react";

const conversations = [
  { id: 1, name: "João Silva", lastMsg: "Olá, preciso de ajuda com meu pedido", time: "14:32", unread: 3, tag: "Vendas" },
  { id: 2, name: "Maria Santos", lastMsg: "Obrigada pelo atendimento!", time: "14:15", unread: 0, tag: "Suporte" },
  { id: 3, name: "Carlos Oliveira", lastMsg: "Qual o prazo de entrega?", time: "13:58", unread: 1, tag: "Vendas" },
  { id: 4, name: "Ana Costa", lastMsg: "Vocês aceitam PIX?", time: "13:40", unread: 2, tag: "Financeiro" },
  { id: 5, name: "Pedro Lima", lastMsg: "Meu produto chegou com defeito", time: "12:20", unread: 0, tag: "Suporte" },
];

const messages = [
  { id: 1, text: "Olá, preciso de ajuda com meu pedido #4521", from: "contact", time: "14:30" },
  { id: 2, text: "Olá João! Claro, vou verificar para você. Um momento.", from: "agent", time: "14:31" },
  { id: 3, text: "Obrigado! É sobre o prazo de entrega", from: "contact", time: "14:32" },
  { id: 4, text: "Seu pedido está em trânsito e deve chegar em 2 dias úteis. Posso ajudar com mais alguma coisa?", from: "agent", time: "14:33" },
];

const Chat = () => {
  const [selected, setSelected] = useState(conversations[0]);
  const [msg, setMsg] = useState("");

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
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelected(conv)}
              className={`flex items-center gap-3 p-3 cursor-pointer border-b border-border/50 transition-colors hover:bg-secondary/30 ${
                selected.id === conv.id ? "bg-secondary/50" : ""
              }`}
            >
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground truncate">{conv.name}</span>
                  <span className="text-[10px] text-muted-foreground">{conv.time}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-muted-foreground truncate">{conv.lastMsg}</p>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary/30 text-primary">{conv.tag}</Badge>
                    {conv.unread > 0 && (
                      <span className="h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{selected.name}</p>
              <p className="text-[11px] text-muted-foreground">Online · {selected.tag}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3 max-w-2xl mx-auto">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.from === "agent" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    m.from === "agent"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-secondary text-secondary-foreground rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm">{m.text}</p>
                  <p className={`text-[10px] mt-1 ${m.from === "agent" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{m.time}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t border-border bg-card/30">
          <div className="flex items-center gap-2 max-w-2xl mx-auto">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0"><Smile className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0"><Paperclip className="h-5 w-5" /></Button>
            <Input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Digite uma mensagem..."
              className="bg-secondary/50 border-0 h-9"
            />
            <Button size="icon" className="h-9 w-9 shrink-0 rounded-full">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
