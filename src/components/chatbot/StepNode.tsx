import { memo, type FC } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { FlowNodeData } from "@/types/chatbot";
import { nodeTypeConfig, parseWhatsAppFormatting, formatDelay, operatorLabels, triggerTypeLabels, actionTypeLabels, FINALIZER_TYPES } from "@/types/chatbot";
import {
  Zap, MessageSquare, Image, Mic, Video, FileText, LayoutGrid, List,
  GitBranch, Clock, UserPlus, XCircle, Tag, Globe, Sparkles, Cog, Shuffle,
  MessageCircle, MousePointerClick,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, FC<{ className?: string }>> = {
  Zap, MessageSquare, Image, Mic, Video, FileText, LayoutGrid, List,
  GitBranch, Clock, UserPlus, XCircle, Tag, Globe, Sparkles, Cog, Shuffle,
  MessageCircle, MousePointerClick,
};

/* ──────── Node Preview ──────── */
function NodePreview({ data }: { data: FlowNodeData }) {
  switch (data.type) {
    case "trigger":
      return (
        <div className="space-y-1">
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
            {triggerTypeLabels[data.triggerType || "keyword"]}
          </span>
          {data.triggerValue && <p className="text-[11px] text-muted-foreground truncate">"{data.triggerValue}"</p>}
        </div>
      );

    case "sendText":
      return data.textContent ? (
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3"
          dangerouslySetInnerHTML={{ __html: parseWhatsAppFormatting(data.textContent.substring(0, 120)) }} />
      ) : (
        <p className="text-[11px] text-muted-foreground/50 italic">Mensagem vazia</p>
      );

    case "sendImage":
      return (
        <div className="space-y-1">
          {data.mediaUrl ? (
            <div className="w-full h-16 rounded bg-muted overflow-hidden">
              <img src={data.mediaUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground/50">
              <Image className="h-8 w-8" /><span className="text-[10px] italic">Sem imagem</span>
            </div>
          )}
          {data.caption && <p className="text-[10px] text-muted-foreground truncate">{data.caption}</p>}
        </div>
      );

    case "sendAudio":
      return (
        <div className="flex items-center gap-2 py-1">
          <Mic className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-0.5">
            {[3, 5, 8, 4, 7, 3, 6, 4, 5, 3].map((h, i) => (
              <div key={i} className="w-1 rounded-full bg-primary/60" style={{ height: `${h * 2}px` }} />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">{data.audioUrl ? "Áudio" : "Sem áudio"}</span>
        </div>
      );

    case "sendVideo":
      return (
        <div className="flex items-center gap-1.5 text-muted-foreground/60">
          <Video className="h-6 w-6" />
          <span className="text-[10px]">{data.mediaUrl ? "Vídeo anexado" : "Sem vídeo"}</span>
        </div>
      );

    case "sendFile":
      return (
        <div className="flex items-center gap-1.5 text-muted-foreground/60">
          <FileText className="h-5 w-5" />
          <span className="text-[10px] truncate">{data.fileName || data.fileUrl?.split("/").pop() || "Sem arquivo"}</span>
        </div>
      );

    case "sendButtons":
      return (
        <div className="space-y-1.5">
          {data.textContent && (
            <p className="text-[11px] text-muted-foreground line-clamp-2"
              dangerouslySetInnerHTML={{ __html: parseWhatsAppFormatting(data.textContent.substring(0, 80)) }} />
          )}
          <div className="flex flex-wrap gap-1">
            {(data.buttons || []).map((btn) => (
              <span key={btn.id} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/15 text-primary border border-primary/20">{btn.text}</span>
            ))}
          </div>
        </div>
      );

    case "sendList":
      return (
        <div className="space-y-1">
          {data.textContent && <p className="text-[11px] text-muted-foreground truncate">{data.textContent}</p>}
          {(data.listSections || []).map((sec, i) => (
            <div key={i} className="pl-1.5 border-l-2 border-primary/30">
              <p className="text-[10px] font-medium text-foreground/80">{sec.title}</p>
              {sec.rows.slice(0, 2).map((row) => (
                <p key={row.id} className="text-[10px] text-muted-foreground">• {row.title}</p>
              ))}
              {sec.rows.length > 2 && <p className="text-[10px] text-muted-foreground/50">+{sec.rows.length - 2} mais</p>}
            </div>
          ))}
        </div>
      );

    case "condition":
      return (
        <div className="space-y-1">
          <p className="text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground/80">{data.conditionField || "mensagem"}</span>{" "}
            <span className="text-primary">{operatorLabels[data.conditionOperator || "contains"]}</span>{" "}
            "{data.conditionValue || "..."}"
          </p>
          <div className="flex gap-2 text-[10px]">
            <span className="text-emerald-400">✓ Sim</span>
            <span className="text-red-400">✗ Não</span>
          </div>
        </div>
      );

    case "waitDelay":
      return (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-mono font-semibold text-foreground/80">{formatDelay(data.delaySeconds || 3)}</span>
          {data.simulateTyping && <span className="text-[10px] text-muted-foreground">· digitando...</span>}
        </div>
      );

    case "action":
      return (
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-500/15 text-orange-400">
            {actionTypeLabels[data.actionType || "assignAgent"]}
          </span>
          {data.actionValue && <span className="text-[10px] text-muted-foreground truncate">{data.actionValue}</span>}
        </div>
      );

    case "randomizer":
      return (
        <div className="flex items-center gap-1.5">
          <Shuffle className="h-4 w-4 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">{data.paths || 2} caminhos</span>
        </div>
      );

    case "waitForReply": {
      const unit = data.replyTimeoutUnit === "hours" ? "h" : data.replyTimeoutUnit === "seconds" ? "s" : "min";
      return (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground font-medium">Aguardando resposta...</span>
          </div>
          <p className="text-[10px] text-muted-foreground/70">Timeout: {data.replyTimeout || 5}{unit}</p>
        </div>
      );
    }

    case "waitForClick": {
      const unit = data.clickTimeoutUnit === "hours" ? "h" : data.clickTimeoutUnit === "seconds" ? "s" : "min";
      return (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground font-medium">Aguardando clique</span>
          </div>
          <p className="text-[10px] text-muted-foreground/70">Timeout: {data.clickTimeout || 5}{unit}</p>
        </div>
      );
    }

    case "aiAgent":
      return (
        <div className="space-y-1">
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/15 text-purple-400">
            {(data.aiModel || "gemini-2.5-flash").split("/").pop()}
          </span>
          {data.aiSystemPrompt && <p className="text-[10px] text-muted-foreground line-clamp-2">{data.aiSystemPrompt.substring(0, 80)}</p>}
        </div>
      );

    default:
      return <p className="text-[11px] text-muted-foreground">{(nodeTypeConfig as any)[data.type]?.description || String(data.type)}</p>;
  }
}

/* ──────── Step Node ──────── */
const StepNode = ({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as FlowNodeData;
  const config = nodeTypeConfig[nodeData.type];
  if (!config) return null;
  const Icon = iconMap[config.icon] || Zap;

  const isCondition = nodeData.type === "condition";
  const isRandomizer = nodeData.type === "randomizer";
  const hasButtons = nodeData.type === "sendButtons" && (nodeData.buttons?.length || 0) > 0;
  const isFinisher = FINALIZER_TYPES.includes(nodeData.type);
  const isTrigger = nodeData.type === "trigger";

  return (
    <div
      className={cn(
        "relative min-w-[220px] max-w-[280px] rounded-lg border bg-card transition-all duration-150",
        selected
          ? "ring-1 ring-primary/60 shadow-md border-primary/40"
          : "shadow-sm border-border/40 hover:shadow-md hover:border-border/60",
        nodeData.isDockTarget && "ring-2 ring-blue-400 border-blue-400/50"
      )}
    >
      {/* Target handle */}
      {!isTrigger && (
        <Handle type="target" position={Position.Left}
          className="!w-3.5 !h-3.5 !bg-muted-foreground/50 !border-2 !border-card !rounded-full !top-1/2 !-translate-y-1/2" />
      )}

      {/* Header */}
      {isTrigger ? (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-white/90 text-[11px] font-semibold tracking-wide uppercase"
          style={{ background: `linear-gradient(135deg, ${config.color}, hsl(142 40% 35%))` }}>
          <Icon className="h-3 w-3 opacity-80" />
          <span className="truncate">{nodeData.label || config.label}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-white/90 text-[11px] font-semibold tracking-wide uppercase"
          style={{ borderTop: `3px solid ${config.color}` }}>
          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: config.color }}>
            <Icon className="h-3 w-3 text-white" />
          </div>
          <span className="truncate text-foreground/80">{nodeData.label || config.label}</span>
        </div>
      )}

      {/* Body */}
      <div className="px-3 py-2.5">
        <NodePreview data={nodeData} />
      </div>

      {/* Source handles */}
      {isCondition ? (
        <div className="absolute right-0 top-0 bottom-0 flex flex-col items-end justify-center gap-5 -mr-1 pointer-events-none">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <span className="text-[9px] font-semibold text-emerald-500/80">Sim</span>
            <Handle type="source" position={Position.Right} id="output-0"
              className="!relative !transform-none !top-auto !left-auto !w-3.5 !h-3.5 !bg-emerald-500 !border-2 !border-card !rounded-full" />
          </div>
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <span className="text-[9px] font-semibold text-red-400/80">Não</span>
            <Handle type="source" position={Position.Right} id="output-1"
              className="!relative !transform-none !top-auto !left-auto !w-3.5 !h-3.5 !bg-red-400 !border-2 !border-card !rounded-full" />
          </div>
        </div>
      ) : isFinisher ? (
        <div className="absolute right-0 top-0 bottom-0 flex flex-col items-end justify-center gap-5 -mr-1 pointer-events-none">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <span className="text-[9px] font-semibold text-emerald-500/80">Continuou ✓</span>
            <Handle type="source" position={Position.Right} id="output-0"
              className="!relative !transform-none !top-auto !left-auto !w-3.5 !h-3.5 !bg-emerald-500 !border-2 !border-card !rounded-full" />
          </div>
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <span className="text-[9px] font-semibold text-orange-400/80">Não respondeu ⏱</span>
            <Handle type="source" position={Position.Right} id="output-1"
              className="!relative !transform-none !top-auto !left-auto !w-3.5 !h-3.5 !bg-orange-400 !border-2 !border-card !rounded-full" />
          </div>
        </div>
      ) : isRandomizer ? (
        <div className="absolute right-0 top-0 bottom-0 flex flex-col items-end justify-center -mr-1 pointer-events-none" style={{ gap: "6px" }}>
          {Array.from({ length: nodeData.paths || 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1.5 pointer-events-auto">
              <span className="text-[8px] font-medium text-muted-foreground/70">#{i + 1}</span>
              <Handle type="source" position={Position.Right} id={`output-${i}`}
                className="!relative !transform-none !top-auto !left-auto !w-3 !h-3 !bg-primary/70 !border-2 !border-card !rounded-full" />
            </div>
          ))}
        </div>
      ) : hasButtons ? (
        <div className="absolute right-0 top-0 bottom-0 flex flex-col items-end justify-center -mr-1 pointer-events-none" style={{ gap: "6px" }}>
          {(nodeData.buttons || []).map((btn) => (
            <div key={btn.id} className="flex items-center gap-1.5 pointer-events-auto">
              <span className="text-[8px] font-medium text-muted-foreground/70 max-w-[60px] truncate">{btn.text}</span>
              <Handle type="source" position={Position.Right} id={`btn_${btn.id}`}
                className="!relative !transform-none !top-auto !left-auto !w-3 !h-3 !bg-primary/70 !border-2 !border-card !rounded-full" />
            </div>
          ))}
        </div>
      ) : (
        <Handle type="source" position={Position.Right}
          className="!w-3.5 !h-3.5 !bg-muted-foreground/50 !border-2 !border-card !rounded-full !top-1/2 !-translate-y-1/2" />
      )}
    </div>
  );
};

export default memo(StepNode);
