import { memo, useState, useCallback, type FC } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { FlowNodeData } from "@/types/chatbot";
import { nodeTypeConfig, formatDelay } from "@/types/chatbot";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Zap, MessageSquare, Image, Mic, Video, FileText, LayoutGrid, List,
  GitBranch, Clock, UserPlus, XCircle, Tag, Globe, Sparkles, Group,
  GripVertical, Ungroup, Plus, Trash2, ChevronUp, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, FC<{ className?: string }>> = {
  Zap, MessageSquare, Image, Mic, Video, FileText, LayoutGrid, List,
  GitBranch, Clock, UserPlus, XCircle, Tag, Globe, Sparkles, Group,
};

function StepBubble({
  step,
  index,
  totalSteps,
  isSelected,
  onSelect,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  step: FlowNodeData;
  index: number;
  totalSteps: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const config = nodeTypeConfig[step.type];
  if (!config) return null;
  const Icon = iconMap[config.icon] || Zap;

  const getPreviewText = () => {
    switch (step.type) {
      case "sendText":
        return step.text ? step.text.substring(0, 60) + (step.text.length > 60 ? "..." : "") : "Mensagem vazia";
      case "sendImage":
        return step.caption || "Imagem";
      case "sendAudio":
        return "Áudio";
      case "sendVideo":
        return step.caption || "Vídeo";
      case "sendDocument":
        return step.mediaUrl ? decodeURIComponent(step.mediaUrl.split("/").pop() || "Documento") : "Documento";
      case "sendButtons":
        return step.text ? step.text.substring(0, 40) : "Botões";
      case "sendList":
        return step.text ? step.text.substring(0, 40) : "Lista";
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
      default:
        return config.label;
    }
  };

  return (
    <div
      className={cn(
        "group/bubble flex items-center gap-1.5 px-1.5 py-2 rounded-lg cursor-pointer transition-all",
        isSelected
          ? "bg-primary/20 ring-1 ring-primary/40"
          : "bg-muted/30 hover:bg-muted/50"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Reorder arrows - left side */}
      <div className="flex flex-col gap-0.5 shrink-0 opacity-0 group-hover/bubble:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 text-muted-foreground hover:text-foreground disabled:opacity-20"
          disabled={index === 0}
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp();
          }}
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 text-muted-foreground hover:text-foreground disabled:opacity-20"
          disabled={index === totalSteps - 1}
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown();
          }}
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>

      {/* Icon */}
      <div
        className="flex items-center justify-center w-6 h-6 rounded-md shrink-0"
        style={{ backgroundColor: config.color }}
      >
        <Icon className="h-3 w-3 text-white" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-foreground/90 truncate">{config.label}</p>
        <p className="text-[10px] text-muted-foreground truncate">{getPreviewText()}</p>
        {step.type === "sendButtons" && step.buttons && step.buttons.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {step.buttons.map((btn) => (
              <span key={btn.id} className="px-1.5 py-0.5 rounded text-[9px] bg-primary/15 text-primary border border-primary/20">
                {btn.text}
              </span>
            ))}
          </div>
        )}
        {step.type === "sendImage" && step.mediaUrl && (
          <div className="mt-1 w-full h-10 rounded overflow-hidden bg-muted">
            <img src={step.mediaUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        )}
      </div>

      {/* Delete */}
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 shrink-0 opacity-0 group-hover/bubble:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-2.5 w-2.5" />
      </Button>
    </div>
  );
}

function DelayIndicator({ delayMs }: { delayMs: number }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-0.5">
      <div className="flex-1 border-t border-dashed border-emerald-500/30" />
      <span className="text-[9px] font-medium text-emerald-400 whitespace-nowrap">
        {formatDelay(delayMs)} · digitando...
      </span>
      <div className="flex-1 border-t border-dashed border-emerald-500/30" />
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
        className="!w-3 !h-3 !bg-primary !border-2 !border-background !top-1/2 !-translate-y-1/2"
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
              <StepBubble
                step={step}
                index={i}
                totalSteps={steps.length}
                isSelected={false}
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
                  if (i < steps.length - 1) emitEvent("group-step-reorder", { groupId: id, fromIndex: i, toIndex: i + 1 });
                }}
              />
              {i < steps.length - 1 && (
                <DelayIndicator delayMs={steps[i + 1]?.delayMs || defaultDelay} />
              )}
            </div>
          ))
        )}

        {/* Add step button */}
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
      </div>

      {/* Source handle - right */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background !top-1/2 !-translate-y-1/2"
      />
    </div>
  );
};

export default memo(GroupNode);
