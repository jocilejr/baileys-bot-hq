import { memo, useState, useCallback, type FC } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { FlowNodeData } from "@/types/chatbot";
import { nodeTypeConfig, formatDelay, BLOCK_FINISHERS } from "@/types/chatbot";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Zap, MessageSquare, Image, Mic, Video, FileText, LayoutGrid, List,
  GitBranch, Clock, UserPlus, XCircle, Tag, Globe, Sparkles, Group,
  GripVertical, Ungroup, Plus, Trash2, ChevronUp, ChevronDown,
  MessageCircle, MousePointerClick,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, FC<{ className?: string }>> = {
  Zap, MessageSquare, Image, Mic, Video, FileText, LayoutGrid, List,
  GitBranch, Clock, UserPlus, XCircle, Tag, Globe, Sparkles, Group,
  MessageCircle, MousePointerClick,
};

function formatWhatsApp(text: string): string {
  return text
    .replace(/\*(.*?)\*/g, "<b>$1</b>")
    .replace(/_(.*?)_/g, "<i>$1</i>")
    .replace(/~(.*?)~/g, "<s>$1</s>");
}

function DelayIndicator({ delayMs }: { delayMs: number }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5">
      <div className="flex-1 border-t border-dashed border-emerald-500/30" />
      <span className="text-[9px] font-medium text-emerald-400 whitespace-nowrap">
        {formatDelay(delayMs)} · digitando...
      </span>
      <div className="flex-1 border-t border-dashed border-emerald-500/30" />
    </div>
  );
}

/** Message-type steps rendered as WhatsApp-style chat bubbles */
const MESSAGE_TYPES = ["sendText", "sendImage", "sendAudio", "sendVideo", "sendDocument", "sendButtons", "sendList"];

function StepBubble({
  step,
  index,
  totalSteps,
  isSelected,
  isFinisher,
  onSelect,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  step: FlowNodeData;
  index: number;
  totalSteps: number;
  isSelected: boolean;
  isFinisher: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const config = nodeTypeConfig[step.type];
  if (!config) return null;
  const Icon = iconMap[config.icon] || Zap;
  const isMessage = MESSAGE_TYPES.includes(step.type);

  const getPreviewContent = () => {
    switch (step.type) {
      case "sendText":
        return step.text ? (
          <p
            className="text-[12px] text-foreground leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: formatWhatsApp(step.text.substring(0, 200)) }}
          />
        ) : (
          <p className="text-[11px] text-muted-foreground/50 italic">Mensagem vazia</p>
        );
      case "sendImage":
        return (
          <div className="space-y-1">
            {step.mediaUrl ? (
              <div className="w-full h-20 rounded overflow-hidden bg-muted">
                <img src={step.mediaUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-muted-foreground/50">
                <Image className="h-5 w-5" />
                <span className="text-[10px] italic">Sem imagem</span>
              </div>
            )}
            {step.caption && <p className="text-[11px] text-foreground">{step.caption}</p>}
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
            <span className="text-[10px] text-muted-foreground">{step.mediaUrl ? "Áudio" : "Sem áudio"}</span>
          </div>
        );
      case "sendVideo":
        return (
          <div className="flex items-center gap-1.5 text-muted-foreground/60">
            <Video className="h-5 w-5" />
            <span className="text-[10px]">{step.mediaUrl ? "Vídeo anexado" : "Sem vídeo"}</span>
          </div>
        );
      case "sendDocument":
        return (
          <div className="flex items-center gap-1.5 text-muted-foreground/60">
            <FileText className="h-5 w-5" />
            <span className="text-[10px] truncate">
              {step.mediaUrl ? decodeURIComponent(step.mediaUrl.split("/").pop() || "arquivo") : "Sem arquivo"}
            </span>
          </div>
        );
      case "sendButtons":
        return (
          <div className="space-y-1.5">
            {step.text && (
              <p className="text-[12px] text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: formatWhatsApp(step.text.substring(0, 120)) }} />
            )}
            <div className="flex flex-wrap gap-1">
              {(step.buttons || []).map((btn) => (
                <span key={btn.id} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/15 text-primary border border-primary/20">
                  {btn.text}
                </span>
              ))}
            </div>
          </div>
        );
      case "sendList":
        return (
          <div className="space-y-1">
            {step.text && <p className="text-[11px] text-foreground">{step.text.substring(0, 60)}</p>}
            <span className="text-[10px] text-muted-foreground">{(step.listSections || []).reduce((a, s) => a + s.rows.length, 0)} itens</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Non-message steps (logic, action, etc.) — compact row style
  const getNonMessagePreview = () => {
    switch (step.type) {
      case "condition":
        return `${step.conditionField || "mensagem"} ${step.conditionOperator || "contém"} "${step.conditionValue || "..."}"`;
      case "delay":
        return `Aguardar ${formatDelay(step.delayMs || 3000)}`;
      case "assignAgent":
        return step.department || "Transferir";
      case "closeChat":
        return "Fechar conversa";
      case "setTag":
        return step.tagName || "Tag";
      case "httpRequest":
        return `${step.httpMethod || "POST"} ${step.httpUrl ? step.httpUrl.substring(0, 30) : "..."}`;
      case "aiResponse":
        return (step.aiModel || "gemini").split("/").pop();
      case "trigger":
        return step.triggerValue || "Gatilho";
      case "waitMessage":
        return "Aguardando resposta...";
      case "waitClick":
        return "Aguardando clique no link";
      default:
        return config.label;
    }
  };

  // WhatsApp-style chat bubble for message types
  if (isMessage) {
    return (
      <div
        className={cn(
          "relative group/bubble rounded-lg cursor-pointer transition-all",
          isSelected ? "ring-1 ring-primary/40" : ""
        )}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        <div className="bg-muted/60 rounded-lg px-3 py-2 border border-border/30">
          {getPreviewContent()}
        </div>

        {/* Hover controls */}
        <div className="absolute -left-5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover/bubble:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-4 w-4 text-muted-foreground hover:text-foreground disabled:opacity-20" disabled={index === 0}
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}>
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-4 w-4 text-muted-foreground hover:text-foreground disabled:opacity-20" disabled={index === totalSteps - 1 || isFinisher}
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
        <div className="absolute -right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-2.5 w-2.5" />
          </Button>
        </div>
      </div>
    );
  }

  // Compact row for non-message steps (logic, action, finisher)
  return (
    <div
      className={cn(
        "relative group/bubble flex items-center gap-1.5 px-1.5 py-2 rounded-lg cursor-pointer transition-all",
        isFinisher
          ? "bg-amber-500/10 border border-dashed border-amber-500/40 ring-0"
          : isSelected
            ? "bg-primary/20 ring-1 ring-primary/40"
            : "bg-muted/30 hover:bg-muted/50"
      )}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      {/* Reorder arrows */}
      <div className="flex flex-col gap-0.5 shrink-0 opacity-0 group-hover/bubble:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-4 w-4 text-muted-foreground hover:text-foreground disabled:opacity-20" disabled={index === 0}
          onClick={(e) => { e.stopPropagation(); onMoveUp(); }}>
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-4 w-4 text-muted-foreground hover:text-foreground disabled:opacity-20" disabled={index === totalSteps - 1 || isFinisher}
          onClick={(e) => { e.stopPropagation(); onMoveDown(); }}>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>

      {/* Icon */}
      <div className="flex items-center justify-center w-6 h-6 rounded-md shrink-0" style={{ backgroundColor: config.color }}>
        <Icon className="h-3 w-3 text-white" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-foreground/90 truncate">{config.label}</p>
        <p className="text-[10px] text-muted-foreground truncate">{getNonMessagePreview()}</p>
      </div>

      {/* Delete */}
      <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 opacity-0 group-hover/bubble:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}>
        <Trash2 className="h-2.5 w-2.5" />
      </Button>

      {/* Dual output handles on finisher bubble */}
      {isFinisher && (
        <div className="absolute right-0 top-0 bottom-0 flex flex-col items-end justify-center gap-4 -mr-3 pointer-events-none">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <span className="text-[9px] font-semibold text-emerald-500/80">Respondeu</span>
            <Handle type="source" position={Position.Right} id="responded"
              className="!relative !transform-none !top-auto !left-auto !w-2 !h-2 !bg-emerald-500 !border !border-background/80" />
          </div>
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <span className="text-[9px] font-semibold text-red-400/80">Não respondeu</span>
            <Handle type="source" position={Position.Right} id="timeout"
              className="!relative !transform-none !top-auto !left-auto !w-2 !h-2 !bg-red-400 !border !border-background/80" />
          </div>
        </div>
      )}
    </div>
  );
}


interface GroupNodeProps extends NodeProps {
  data: Record<string, unknown>;
}

const GroupNode = ({ data, selected, id }: GroupNodeProps) => {
  const nodeData = data as unknown as FlowNodeData;
  const [editing, setEditing] = useState(false);
  const title = nodeData.groupTitle || nodeData.label || "Grupo";
  const steps = nodeData.steps || [];
  const defaultDelay = nodeData.defaultDelay || 3000;
  const isSealed = steps.length > 0 && BLOCK_FINISHERS.includes(steps[steps.length - 1].type);

  const emitEvent = useCallback((eventName: string, detail: Record<string, unknown>) => {
    document.dispatchEvent(new CustomEvent(eventName, { detail }));
  }, []);

  return (
    <div
      className={cn(
        "relative min-w-[260px] max-w-[320px] rounded-xl border shadow-lg transition-all",
        selected
          ? "ring-2 ring-primary shadow-xl border-primary/30 bg-card"
          : "border-border/60 bg-card hover:shadow-xl"
      )}
    >
      {/* Target handle - left */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-muted-foreground/50 !border !border-background/80 !top-1/2 !-translate-y-1/2"
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-t-xl bg-muted/60 border-b border-border/40">
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 cursor-grab" />
        <Group className="h-3.5 w-3.5 text-muted-foreground" />
        {editing ? (
          <Input
            autoFocus
            defaultValue={title}
            className="h-6 text-xs bg-transparent border-none px-1 focus-visible:ring-0 flex-1"
            onBlur={(e) => {
              setEditing(false);
              emitEvent("group-title-change", { id, title: e.target.value });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
          />
        ) : (
          <span
            className="text-xs font-semibold text-foreground/80 cursor-pointer hover:text-foreground transition-colors flex-1 truncate"
            onDoubleClick={() => setEditing(true)}
          >
            {title}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-muted-foreground hover:text-destructive shrink-0"
          title="Desagrupar"
          onClick={(e) => {
            e.stopPropagation();
            emitEvent("ungroup-nodes", { groupId: id });
          }}
        >
          <Ungroup className="h-3 w-3" />
        </Button>
      </div>

      {/* Steps */}
      <div className="p-2 space-y-0">
        {steps.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground/50">
            <p className="text-[11px]">Arraste nós para cá</p>
          </div>
        ) : (
          steps.map((step, i) => (
            <div key={step.stepId || i}>
              {i > 0 && step.type === "delay" && (
                <DelayIndicator delayMs={step.delayMs || defaultDelay} />
              )}
              <StepBubble
                step={step}
                index={i}
                totalSteps={steps.length}
                isSelected={false}
                isFinisher={BLOCK_FINISHERS.includes(step.type)}
                onSelect={() => {
                  emitEvent("group-step-select", { groupId: id, stepIndex: i, stepData: step });
                }}
                onDelete={() => {
                  emitEvent("group-step-remove", { groupId: id, stepIndex: i });
                }}
                onMoveUp={() => {
                  if (i > 0) emitEvent("group-step-reorder", { groupId: id, fromIndex: i, toIndex: i - 1 });
                }}
                onMoveDown={() => {
                  if (i < steps.length - 1 && !BLOCK_FINISHERS.includes(step.type) && !BLOCK_FINISHERS.includes(steps[i + 1].type))
                    emitEvent("group-step-reorder", { groupId: id, fromIndex: i, toIndex: i + 1 });
                }}
              />
            </div>
          ))
        )}

        {/* Add step button - hidden when sealed */}
        {!isSealed && (
          <div className="pt-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-[10px] text-muted-foreground hover:text-foreground border border-dashed border-border/50 hover:border-border"
              onClick={(e) => {
                e.stopPropagation();
                emitEvent("group-add-step", { groupId: id });
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Adicionar passo
            </Button>
          </div>
        )}
      </div>

      {/* Source handle - right (single, only when NOT sealed — sealed uses finisher bubble handles) */}
      {!isSealed && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-2 !h-2 !bg-muted-foreground/50 !border !border-background/80 !top-1/2 !-translate-y-1/2"
        />
      )}
    </div>
  );
};

export default memo(GroupNode);
