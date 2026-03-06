import { memo, type FC } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { FlowNodeData } from "@/types/chatbot";
import { nodeTypeConfig } from "@/types/chatbot";
import {
  Zap, MessageSquare, Image, Mic, Video, FileText, LayoutGrid, List,
  GitBranch, Clock, UserPlus, XCircle, Tag, Globe, Sparkles, Trash2, Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, FC<{ className?: string }>> = {
  Zap, MessageSquare, Image, Mic, Video, FileText, LayoutGrid, List,
  GitBranch, Clock, UserPlus, XCircle, Tag, Globe, Sparkles,
};

const StepNode = ({ data, selected, id }: NodeProps) => {
  const nodeData = data as unknown as FlowNodeData;
  const config = nodeTypeConfig[nodeData.type];
  const Icon = iconMap[config.icon] || Zap;

  const preview = nodeData.text
    ? nodeData.text.substring(0, 60) + (nodeData.text.length > 60 ? "…" : "")
    : nodeData.triggerValue
      ? `${nodeData.triggerType}: ${nodeData.triggerValue}`
      : config.description;

  return (
    <div
      className={cn(
        "relative min-w-[200px] max-w-[260px] rounded-lg border bg-card shadow-md transition-all",
        selected ? "ring-2 ring-primary shadow-lg" : "hover:shadow-lg"
      )}
    >
      {nodeData.type !== "trigger" && (
        <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-primary !border-2 !border-background" />
      )}

      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-lg text-white text-xs font-semibold"
        style={{ backgroundColor: config.color }}
      >
        <Icon className="h-3.5 w-3.5" />
        <span className="truncate">{nodeData.label || config.label}</span>
      </div>

      <div className="px-3 py-2.5">
        <p className="text-xs text-muted-foreground leading-relaxed">{preview}</p>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-primary !border-2 !border-background" />
    </div>
  );
};

export default memo(StepNode);
