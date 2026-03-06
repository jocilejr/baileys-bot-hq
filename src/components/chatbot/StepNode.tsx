import { memo, type FC } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { FlowNodeData } from "@/types/chatbot";
import { nodeTypeConfig, formatDelay, operatorLabels, triggerTypeLabels } from "@/types/chatbot";
import {
  Zap, MessageSquare, Image, Mic, Video, FileText, LayoutGrid, List,
  GitBranch, Clock, UserPlus, XCircle, Tag, Globe, Sparkles, Group,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, FC<{ className?: string }>> = {
  Zap, MessageSquare, Image, Mic, Video, FileText, LayoutGrid, List,
  GitBranch, Clock, UserPlus, XCircle, Tag, Globe, Sparkles, Group,
};

function formatWhatsApp(text: string): string {
  return text
    .replace(/\*(.*?)\*/g, "<b>$1</b>")
    .replace(/_(.*?)_/g, "<i>$1</i>")
    .replace(/~(.*?)~/g, "<s>$1</s>");
}

function NodePreview({ data }: { data: FlowNodeData }) {
  switch (data.type) {
    case "trigger":
      return (
        <div className="space-y-1">
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
            {triggerTypeLabels[data.triggerType || "keyword"]}
          </span>
          {data.triggerValue && (
            <p className="text-[11px] text-muted-foreground truncate">"{data.triggerValue}"</p>
          )}
        </div>
      );

    case "sendText":
      return data.text ? (
        <p
          className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3"
          dangerouslySetInnerHTML={{ __html: formatWhatsApp(data.text.substring(0, 120)) }}
        />
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
              <Image className="h-8 w-8" />
              <span className="text-[10px] italic">Sem imagem</span>
            </div>
          )}
          {data.caption && <p className="text-[10px] text-muted-foreground truncate">{data.caption}</p>}
        </div>
      );

    case "sendAudio":
      return (
        <div className="flex items-center gap-2 py-1">
          <div className="flex items-center gap-0.5">
            {[3, 5, 8, 4, 7, 3, 6, 4, 5, 3].map((h, i) => (
              <div key={i} className="w-1 rounded-full bg-primary/60" style={{ height: `${h * 2}px` }} />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {data.mediaUrl ? "Áudio" : "Sem áudio"}
          </span>
        </div>
      );

    case "sendVideo":
      return (
        <div className="flex items-center gap-1.5 text-muted-foreground/60">
          <Video className="h-6 w-6" />
          <span className="text-[10px]">{data.mediaUrl ? "Vídeo anexado" : "Sem vídeo"}</span>
          {data.caption && <span className="text-[10px] truncate ml-auto">"{data.caption}"</span>}
        </div>
      );

    case "sendDocument":
      return (
        <div className="flex items-center gap-1.5 text-muted-foreground/60">
          <FileText className="h-5 w-5" />
          <div className="min-w-0">
            <p className="text-[10px] truncate">{data.mediaUrl ? data.mediaUrl.split('/').pop() : "Sem arquivo"}</p>
            {data.caption && <p className="text-[10px] text-muted-foreground truncate">{data.caption}</p>}
          </div>
        </div>
      );

    case "sendButtons":
      return (
        <div className="space-y-1.5">
          {data.text && (
            <p className="text-[11px] text-muted-foreground line-clamp-2"
              dangerouslySetInnerHTML={{ __html: formatWhatsApp(data.text.substring(0, 80)) }}
            />
          )}
          <div className="flex flex-wrap gap-1">
            {(data.buttons || []).map((btn) => (
              <span key={btn.id} className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/15 text-primary border border-primary/20">
                {btn.text}
              </span>
            ))}
          </div>
        </div>
      );

    case "sendList":
      return (
        <div className="space-y-1">
          {data.text && <p className="text-[11px] text-muted-foreground truncate">{data.text}</p>}
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
            <span className="font-medium text-foreground/80">{data.conditionField || "mensagem"}</span>
            {" "}
            <span className="text-primary">{operatorLabels[data.conditionOperator || "contains"]}</span>
            {" "}
            "{data.conditionValue || "..."}"
          </p>
          <div className="flex gap-2 text-[10px]">
            <span className="text-emerald-400">✓ Sim</span>
            <span className="text-red-400">✗ Não</span>
          </div>
        </div>
      );

    case "delay":
      return (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-mono font-semibold text-foreground/80">
            {formatDelay(data.delayMs || 3000)}
          </span>
        </div>
      );

    case "assignAgent":
      return (
        <div className="flex items-center gap-1.5">
          <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">
            {data.department || <span className="italic text-muted-foreground/50">Sem departamento</span>}
          </span>
        </div>
      );

    case "closeChat":
      return (
        <p className="text-[11px] text-red-400/80 font-medium">Encerra a conversa</p>
      );

    case "setTag":
      return data.tagName ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
          <Tag className="h-2.5 w-2.5" />
          {data.tagName}
        </span>
      ) : (
        <p className="text-[11px] text-muted-foreground/50 italic">Sem tag definida</p>
      );

    case "httpRequest":
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-bold",
              data.httpMethod === "GET" ? "bg-emerald-500/15 text-emerald-400" :
              data.httpMethod === "PUT" ? "bg-amber-500/15 text-amber-400" :
              "bg-blue-500/15 text-blue-400"
            )}>
              {data.httpMethod || "POST"}
            </span>
          </div>
          {data.httpUrl && (
            <p className="text-[10px] text-muted-foreground truncate font-mono">{data.httpUrl}</p>
          )}
        </div>
      );

    case "aiResponse":
      return (
        <div className="space-y-1">
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/15 text-purple-400">
            {(data.aiModel || "gemini-2.5-flash").split("/").pop()}
          </span>
          {data.aiPrompt && (
            <p className="text-[10px] text-muted-foreground line-clamp-2">{data.aiPrompt.substring(0, 80)}</p>
          )}
        </div>
      );

    default:
      return <p className="text-[11px] text-muted-foreground">{nodeTypeConfig[data.type]?.description}</p>;
  }
}

const StepNode = ({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as FlowNodeData;
  const config = nodeTypeConfig[nodeData.type];
  if (!config) return null;
  const Icon = iconMap[config.icon] || Zap;

  const isCondition = nodeData.type === "condition";
  const hasButtons = nodeData.type === "sendButtons" && (nodeData.buttons?.length || 0) > 0;

  return (
    <div
      className={cn(
        "relative min-w-[220px] max-w-[280px] rounded-lg border bg-card shadow-md transition-all",
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
        <NodePreview data={nodeData} />
      </div>

      {/* Conditional handles: Sim/Não */}
      {isCondition ? (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="yes"
            className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-background"
            style={{ left: "30%" }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="no"
            className="!w-3 !h-3 !bg-red-500 !border-2 !border-background"
            style={{ left: "70%" }}
          />
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-6 -mb-5 pointer-events-none">
            <span className="text-[9px] font-bold text-emerald-400">Sim</span>
            <span className="text-[9px] font-bold text-red-400">Não</span>
          </div>
        </>
      ) : hasButtons ? (
        <>
          {(nodeData.buttons || []).map((btn, i) => {
            const total = nodeData.buttons!.length;
            const pct = ((i + 1) / (total + 1)) * 100;
            return (
              <Handle
                key={btn.id}
                type="source"
                position={Position.Bottom}
                id={`btn_${btn.id}`}
                className="!w-2.5 !h-2.5 !bg-primary !border-2 !border-background"
                style={{ left: `${pct}%` }}
              />
            );
          })}
        </>
      ) : (
        <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-primary !border-2 !border-background" />
      )}
    </div>
  );
};

export default memo(StepNode);
