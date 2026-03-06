import { type DragEvent } from "react";
import { nodeTypeConfig, categoryLabels, type FlowNodeType } from "@/types/chatbot";
import {
  Zap, MessageSquare, Image, Mic, Video, FileText, LayoutGrid, List,
  GitBranch, Clock, UserPlus, XCircle, Tag, Globe, Sparkles, Group,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FC } from "react";

const iconMap: Record<string, FC<{ className?: string }>> = {
  Zap, MessageSquare, Image, Mic, Video, FileText, LayoutGrid, List,
  GitBranch, Clock, UserPlus, XCircle, Tag, Globe, Sparkles, Group,
};

const grouped = Object.entries(nodeTypeConfig).reduce<Record<string, { type: FlowNodeType; label: string; icon: string; color: string; description: string }[]>>(
  (acc, [type, cfg]) => {
    const cat = cfg.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push({ type: type as FlowNodeType, ...cfg });
    return acc;
  },
  {}
);

export default function NodePalette() {
  const onDragStart = (e: DragEvent, nodeType: FlowNodeType) => {
    e.dataTransfer.setData("application/reactflow", nodeType);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Componentes</h3>
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {categoryLabels[cat] || cat}
            </p>
            <div className="space-y-1">
              {items.map(({ type, label, icon, color, description }) => {
                const Icon = iconMap[icon] || Zap;
                return (
                  <div
                    key={type}
                    draggable
                    onDragStart={(e) => onDragStart(e, type)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-grab hover:bg-accent transition-colors border border-transparent hover:border-border"
                  >
                    <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color }}>
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
