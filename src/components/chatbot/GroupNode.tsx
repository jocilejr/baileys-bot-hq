import { memo, useState, useCallback, type FC } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { FlowNodeData, FlowStepData, FlowNodeType } from "@/types/chatbot";
import { nodeTypeConfig, parseWhatsAppFormatting, formatDelay, FINALIZER_TYPES, operatorLabels, actionTypeLabels, getDefaultNodeData } from "@/types/chatbot";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Zap, MessageSquare, Image, Mic, Video, FileText, LayoutGrid, List,
  GitBranch, Clock, UserPlus, XCircle, Tag, Globe, Sparkles,
  GripVertical, Ungroup, Plus, Trash2, Copy, Cog, Shuffle,
  MessageCircle, MousePointerClick,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, FC<{ className?: string }>> = {
  Zap, MessageSquare, Image, Mic, Video, FileText, LayoutGrid, List,
  GitBranch, Clock, UserPlus, XCircle, Tag, Globe, Sparkles, Cog, Shuffle,
  MessageCircle, MousePointerClick,
};

/* ──────── Audio Preview Player ──────── */
function AudioPreviewPlayer({ url }: { url: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <Mic className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex items-center gap-0.5">
        {[3, 5, 8, 4, 7, 3, 6, 4, 5, 3, 7, 4].map((h, i) => (
          <div key={i} className="w-1 rounded-full bg-primary/60" style={{ height: `${h * 2}px` }} />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground">Áudio</span>
    </div>
  );
}

/* ──────── Step Row ──────── */
function StepRow({
  step,
  index,
  totalSteps,
  groupId,
  isSealed,
  emitEvent,
}: {
  step: FlowStepData;
  index: number;
  totalSteps: number;
  groupId: string;
  isSealed: boolean;
  emitEvent: (name: string, detail: Record<string, unknown>) => void;
}) {
  const d = step.data;
  const config = nodeTypeConfig[d.type];
  if (!config) return null;
  const Icon = iconMap[config.icon] || Zap;
  const isFinisher = FINALIZER_TYPES.includes(d.type);

  const handleSelect = () => emitEvent("group-step-select", { groupId, stepIndex: index, stepData: d });
  const handleDelete = () => emitEvent("group-step-remove", { groupId, stepIndex: index });
  const handleDuplicate = () => emitEvent("group-duplicate-step", { groupId, stepIndex: index });

  // ── sendText: direct bubble ──
  if (d.type === "sendText") {
    return (
      <div className="relative group/step" onClick={(e) => { e.stopPropagation(); handleSelect(); }}>
        <div className="bg-secondary/50 rounded-lg px-3 py-2 cursor-pointer hover:bg-secondary/70 transition-colors border border-transparent hover:border-border/30">
          {d.textContent ? (
            <p className="text-[12px] text-foreground leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: parseWhatsAppFormatting(d.textContent.substring(0, 200)) }} />
          ) : (
            <p className="text-[11px] text-muted-foreground/50 italic">Mensagem vazia</p>
          )}
        </div>
        <StepToolbar index={index} totalSteps={totalSteps} isFinisher={isFinisher} isSealed={isSealed}
          onDelete={handleDelete} onDuplicate={handleDuplicate} />
      </div>
    );
  }

  // ── sendImage ──
  if (d.type === "sendImage") {
    return (
      <div className="relative group/step" onClick={(e) => { e.stopPropagation(); handleSelect(); }}>
        <div className="bg-secondary/50 rounded-lg overflow-hidden cursor-pointer hover:bg-secondary/70 transition-colors border border-transparent hover:border-border/30">
          {d.mediaUrl ? (
            <div className="w-full h-24 bg-muted">
              <img src={d.mediaUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-3 text-muted-foreground/50">
              <Image className="h-6 w-6" />
              <span className="text-[10px] italic">Sem imagem</span>
            </div>
          )}
          {d.caption && <p className="px-3 py-1.5 text-[11px] text-foreground">{d.caption}</p>}
        </div>
        <StepToolbar index={index} totalSteps={totalSteps} isFinisher={isFinisher} isSealed={isSealed}
          onDelete={handleDelete} onDuplicate={handleDuplicate} />
      </div>
    );
  }

  // ── sendAudio ──
  if (d.type === "sendAudio") {
    return (
      <div className="relative group/step" onClick={(e) => { e.stopPropagation(); handleSelect(); }}>
        <div className="bg-secondary/50 rounded-lg px-3 py-2 cursor-pointer hover:bg-secondary/70 transition-colors border border-transparent hover:border-border/30">
          {d.audioUrl ? <AudioPreviewPlayer url={d.audioUrl} /> : (
            <div className="flex items-center gap-2 text-muted-foreground/50">
              <Mic className="h-4 w-4" />
              <span className="text-[10px] italic">Sem áudio</span>
            </div>
          )}
        </div>
        <StepToolbar index={index} totalSteps={totalSteps} isFinisher={isFinisher} isSealed={isSealed}
          onDelete={handleDelete} onDuplicate={handleDuplicate} />
      </div>
    );
  }

  // ── sendVideo ──
  if (d.type === "sendVideo") {
    return (
      <div className="relative group/step" onClick={(e) => { e.stopPropagation(); handleSelect(); }}>
        <div className="bg-secondary/50 rounded-lg px-3 py-2 cursor-pointer hover:bg-secondary/70 transition-colors border border-transparent hover:border-border/30">
          <div className="flex items-center gap-1.5 text-muted-foreground/60">
            <Video className="h-5 w-5" />
            <span className="text-[10px]">{d.mediaUrl ? "Vídeo anexado" : "Sem vídeo"}</span>
          </div>
          {d.caption && <p className="text-[10px] text-foreground mt-1">{d.caption}</p>}
        </div>
        <StepToolbar index={index} totalSteps={totalSteps} isFinisher={isFinisher} isSealed={isSealed}
          onDelete={handleDelete} onDuplicate={handleDuplicate} />
      </div>
    );
  }

  // ── sendFile ──
  if (d.type === "sendFile") {
    return (
      <div className="relative group/step" onClick={(e) => { e.stopPropagation(); handleSelect(); }}>
        <div className="bg-secondary/50 rounded-lg px-3 py-2 cursor-pointer hover:bg-secondary/70 transition-colors border border-transparent hover:border-border/30">
          <div className="flex items-center gap-1.5 text-muted-foreground/60">
            <FileText className="h-5 w-5" />
            <span className="text-[10px] truncate">{d.fileName || d.fileUrl?.split("/").pop() || "Sem arquivo"}</span>
          </div>
        </div>
        <StepToolbar index={index} totalSteps={totalSteps} isFinisher={isFinisher} isSealed={isSealed}
          onDelete={handleDelete} onDuplicate={handleDuplicate} />
      </div>
    );
  }

  // ── sendButtons ──
  if (d.type === "sendButtons") {
    return (
      <div className="relative group/step" onClick={(e) => { e.stopPropagation(); handleSelect(); }}>
        <div className="bg-secondary/50 rounded-lg px-3 py-2 cursor-pointer hover:bg-secondary/70 transition-colors border border-transparent hover:border-border/30">
          {d.textContent && (
            <p className="text-[12px] text-foreground leading-relaxed mb-1.5"
              dangerouslySetInnerHTML={{ __html: parseWhatsAppFormatting(d.textContent.substring(0, 80)) }} />
          )}
          <div className="flex flex-wrap gap-1">
            {(d.buttons || []).map((btn) => (
              <span key={btn.id} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/15 text-primary border border-primary/20">
                {btn.text}
              </span>
            ))}
          </div>
        </div>
        <StepToolbar index={index} totalSteps={totalSteps} isFinisher={isFinisher} isSealed={isSealed}
          onDelete={handleDelete} onDuplicate={handleDuplicate} />
      </div>
    );
  }

  // ── sendList ──
  if (d.type === "sendList") {
    return (
      <div className="relative group/step" onClick={(e) => { e.stopPropagation(); handleSelect(); }}>
        <div className="bg-secondary/50 rounded-lg px-3 py-2 cursor-pointer hover:bg-secondary/70 transition-colors border border-transparent hover:border-border/30">
          {d.textContent && <p className="text-[11px] text-foreground truncate mb-1">{d.textContent}</p>}
          <span className="text-[10px] text-muted-foreground">
            {(d.listSections || []).reduce((a, s) => a + s.rows.length, 0)} itens na lista
          </span>
        </div>
        <StepToolbar index={index} totalSteps={totalSteps} isFinisher={isFinisher} isSealed={isSealed}
          onDelete={handleDelete} onDuplicate={handleDuplicate} />
      </div>
    );
  }

  // ── waitDelay: centralized pill ──
  if (d.type === "waitDelay") {
    return (
      <div className="relative group/step" onClick={(e) => { e.stopPropagation(); handleSelect(); }}>
        <div className="flex items-center gap-1.5 px-2 py-1 cursor-pointer">
          <div className="flex-1 border-t border-dashed border-amber-500/30" />
          <span className="text-[10px] font-medium text-amber-400 whitespace-nowrap flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDelay(d.delaySeconds || 3)}
            {d.simulateTyping && " · digitando..."}
          </span>
          <div className="flex-1 border-t border-dashed border-amber-500/30" />
        </div>
        <StepToolbar index={index} totalSteps={totalSteps} isFinisher={isFinisher} isSealed={isSealed}
          onDelete={handleDelete} onDuplicate={handleDuplicate} />
      </div>
    );
  }

  // ── condition: styled card ──
  if (d.type === "condition") {
    return (
      <div className="relative group/step" onClick={(e) => { e.stopPropagation(); handleSelect(); }}>
        <div className="bg-red-500/10 rounded-lg px-3 py-2 cursor-pointer border border-red-500/20 hover:border-red-500/40 transition-colors">
          <div className="flex items-center gap-1.5 mb-1">
            <GitBranch className="h-3 w-3 text-red-400" />
            <span className="text-[10px] font-semibold text-red-400 uppercase">Condição</span>
          </div>
          <p className="text-[11px] text-foreground/80">
            <span className="font-medium">{d.conditionField || "mensagem"}</span>{" "}
            <span className="text-red-400">{operatorLabels[d.conditionOperator || "contains"]}</span>{" "}
            "{d.conditionValue || "..."}"
          </p>
        </div>
        <StepToolbar index={index} totalSteps={totalSteps} isFinisher={isFinisher} isSealed={isSealed}
          onDelete={handleDelete} onDuplicate={handleDuplicate} />
      </div>
    );
  }

  // ── action: styled card ──
  if (d.type === "action") {
    return (
      <div className="relative group/step" onClick={(e) => { e.stopPropagation(); handleSelect(); }}>
        <div className="bg-orange-500/10 rounded-lg px-3 py-2 cursor-pointer border border-orange-500/20 hover:border-orange-500/40 transition-colors">
          <div className="flex items-center gap-1.5">
            <Cog className="h-3 w-3 text-orange-400" />
            <span className="text-[10px] font-semibold text-orange-400 uppercase">
              {actionTypeLabels[d.actionType || "assignAgent"] || "Ação"}
            </span>
          </div>
          {d.actionValue && <p className="text-[10px] text-foreground/70 mt-0.5 truncate">{d.actionValue}</p>}
        </div>
        <StepToolbar index={index} totalSteps={totalSteps} isFinisher={isFinisher} isSealed={isSealed}
          onDelete={handleDelete} onDuplicate={handleDuplicate} />
      </div>
    );
  }

  // ── waitForClick: styled card ──
  if (d.type === "waitForClick") {
    return (
      <div className="relative group/step" onClick={(e) => { e.stopPropagation(); handleSelect(); }}>
        <div className="bg-blue-500/10 rounded-lg px-3 py-2 cursor-pointer border border-blue-500/20 hover:border-blue-500/40 transition-colors">
          <div className="flex items-center gap-1.5 mb-0.5">
            <MousePointerClick className="h-3 w-3 text-blue-400" />
            <span className="text-[10px] font-semibold text-blue-400 uppercase">Aguardar Clique</span>
          </div>
          {d.clickUrl && <p className="text-[10px] text-foreground/70 font-mono truncate">{d.clickUrl}</p>}
          <p className="text-[9px] text-muted-foreground mt-0.5">
            Timeout: {d.clickTimeout || 5}{d.clickTimeoutUnit === "hours" ? "h" : d.clickTimeoutUnit === "seconds" ? "s" : "min"}
          </p>
        </div>
        <StepToolbar index={index} totalSteps={totalSteps} isFinisher={isFinisher} isSealed={isSealed}
          onDelete={handleDelete} onDuplicate={handleDuplicate} />
      </div>
    );
  }

  // ── waitForReply: styled card ──
  if (d.type === "waitForReply") {
    return (
      <div className="relative group/step" onClick={(e) => { e.stopPropagation(); handleSelect(); }}>
        <div className="bg-teal-500/10 rounded-lg px-3 py-2 cursor-pointer border border-teal-500/20 hover:border-teal-500/40 transition-colors">
          <div className="flex items-center gap-1.5 mb-0.5">
            <MessageCircle className="h-3 w-3 text-teal-400" />
            <span className="text-[10px] font-semibold text-teal-400 uppercase">Esperar Resposta</span>
          </div>
          {d.replyVariable && <p className="text-[10px] text-foreground/70">Salvar em: {d.replyVariable}</p>}
          <p className="text-[9px] text-muted-foreground mt-0.5">
            Timeout: {d.replyTimeout || 5}{d.replyTimeoutUnit === "hours" ? "h" : d.replyTimeoutUnit === "seconds" ? "s" : "min"}
          </p>
        </div>
        <StepToolbar index={index} totalSteps={totalSteps} isFinisher={isFinisher} isSealed={isSealed}
          onDelete={handleDelete} onDuplicate={handleDuplicate} />
      </div>
    );
  }

  // ── Generic fallback ──
  return (
    <div className="relative group/step" onClick={(e) => { e.stopPropagation(); handleSelect(); }}>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border/30">
        <div className="w-6 h-6 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: config.color }}>
          <Icon className="h-3 w-3 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-foreground/90 truncate">{config.label}</p>
          <p className="text-[10px] text-muted-foreground truncate">{config.description}</p>
        </div>
      </div>
      <StepToolbar index={index} totalSteps={totalSteps} isFinisher={isFinisher} isSealed={isSealed}
        onDelete={handleDelete} onDuplicate={handleDuplicate} />
    </div>
  );
}

/* ──────── Step Toolbar (hover) ──────── */
function StepToolbar({
  index, totalSteps, isFinisher, isSealed,
  onDelete, onDuplicate,
}: {
  index: number; totalSteps: number; isFinisher: boolean; isSealed: boolean;
  onDelete: () => void; onDuplicate: () => void;
}) {
  return (
    <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover/step:opacity-100 transition-opacity z-10">
      <Button variant="ghost" size="icon" className="h-5 w-5 bg-card border border-border/50 shadow-sm text-muted-foreground hover:text-foreground"
        onClick={(e) => { e.stopPropagation(); onDuplicate(); }} title="Duplicar">
        <Copy className="h-2.5 w-2.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-5 w-5 bg-card border border-border/50 shadow-sm text-muted-foreground hover:text-destructive"
        onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Apagar">
        <Trash2 className="h-2.5 w-2.5" />
      </Button>
    </div>
  );
}

/* ──────── Add Step Popover ──────── */
const ADDABLE_TYPES: FlowNodeType[] = [
  "sendText", "sendImage", "sendAudio", "sendVideo", "sendFile", "sendButtons", "sendList",
  "waitDelay", "condition", "action", "aiAgent", "waitForReply", "waitForClick",
];

function AddStepPopover({ groupId, isSealed, steps, emitEvent }: {
  groupId: string; isSealed: boolean; steps: FlowStepData[];
  emitEvent: (name: string, detail: Record<string, unknown>) => void;
}) {
  const [open, setOpen] = useState(false);
  if (isSealed) return null;

  const hasFinisher = steps.some((s) => FINALIZER_TYPES.includes(s.data.type));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost" size="sm"
          className="w-full h-7 text-[10px] text-muted-foreground hover:text-foreground border border-dashed border-border/50 hover:border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <Plus className="h-3 w-3 mr-1" />Adicionar passo
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-0.5 max-h-64 overflow-y-auto">
          {ADDABLE_TYPES.filter((t) => {
            if (hasFinisher && FINALIZER_TYPES.includes(t)) return false;
            return true;
          }).map((t) => {
            const cfg = nodeTypeConfig[t];
            const I = iconMap[cfg.icon] || Zap;
            return (
              <button key={t}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-left hover:bg-accent transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  emitEvent("group-add-step", { groupId, stepType: t });
                  setOpen(false);
                }}
              >
                <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: cfg.color }}>
                  <I className="h-2.5 w-2.5 text-white" />
                </div>
                <span className="text-xs text-foreground">{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ──────── Group Node ──────── */
interface GroupNodeProps extends NodeProps {
  data: Record<string, unknown>;
}

const GroupNode = ({ data, selected, id }: GroupNodeProps) => {
  const nodeData = data as unknown as FlowNodeData;
  const [editing, setEditing] = useState(false);
  const title = nodeData.groupTitle || nodeData.label || "Grupo";
  const steps: FlowStepData[] = (nodeData.steps as FlowStepData[]) || [];
  const isSealed = steps.length > 0 && FINALIZER_TYPES.includes(steps[steps.length - 1].data.type);
  const finalizerStep = isSealed ? steps[steps.length - 1] : null;

  const emitEvent = useCallback((eventName: string, detail: Record<string, unknown>) => {
    document.dispatchEvent(new CustomEvent(eventName, { detail }));
  }, []);

  return (
    <div
      className={cn(
        "relative min-w-[260px] max-w-[320px] rounded-xl border shadow-lg transition-all",
        selected
          ? "ring-2 ring-primary shadow-xl border-primary/30 bg-card"
          : "border-border/60 bg-card hover:shadow-xl",
        nodeData.isDockTarget && "ring-2 ring-blue-400 border-blue-400/50"
      )}
    >
      {/* Target handle */}
      <Handle type="target" position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-muted-foreground/50 !border-2 !border-card !rounded-full !top-1/2 !-translate-y-1/2" />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-t-xl bg-muted/60 border-b border-border/40">
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 cursor-grab" />
        {editing ? (
          <Input autoFocus defaultValue={title}
            className="h-6 text-xs bg-transparent border-none px-1 focus-visible:ring-0 flex-1"
            onBlur={(e) => { setEditing(false); emitEvent("group-title-change", { id, title: e.target.value }); }}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          />
        ) : (
          <span className="text-xs font-semibold text-foreground/80 cursor-pointer hover:text-foreground transition-colors flex-1 truncate"
            onDoubleClick={() => setEditing(true)}>
            {title}
          </span>
        )}
        <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive shrink-0" title="Desagrupar"
          onClick={(e) => { e.stopPropagation(); emitEvent("ungroup-nodes", { groupId: id }); }}>
          <Ungroup className="h-3 w-3" />
        </Button>
      </div>

      {/* Steps */}
      <div className="p-2 space-y-1.5">
        {steps.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground/50">
            <p className="text-[11px]">Arraste nós para cá</p>
          </div>
        ) : (
          steps.map((step, i) => (
            <StepRow key={step.id} step={step} index={i} totalSteps={steps.length}
              groupId={id} isSealed={isSealed} emitEvent={emitEvent} />
          ))
        )}

        {/* Add step */}
        <div className="pt-1">
          <AddStepPopover groupId={id} isSealed={isSealed} steps={steps} emitEvent={emitEvent} />
        </div>
      </div>

      {/* Output handles */}
      {isSealed && finalizerStep ? (
        /* Dual outputs for finalizer */
        <div className="px-3 pb-2 pt-1 border-t border-border/30 flex flex-col gap-2">
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-[9px] font-semibold text-emerald-500">Continuou ✓</span>
            <Handle type="source" position={Position.Right} id="output-0"
              className="!relative !transform-none !top-auto !left-auto !w-3.5 !h-3.5 !bg-emerald-500 !border-2 !border-card !rounded-full" />
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-[9px] font-semibold text-orange-400">
              {finalizerStep.data.type === "waitForReply" ? "Se não respondeu ⏱" : "Se não clicou ⏱"}
            </span>
            <Handle type="source" position={Position.Right} id="output-1"
              className="!relative !transform-none !top-auto !left-auto !w-3.5 !h-3.5 !bg-orange-400 !border-2 !border-card !rounded-full" />
          </div>
        </div>
      ) : (
        /* Single output */
        <Handle type="source" position={Position.Right}
          className="!w-3.5 !h-3.5 !bg-muted-foreground/50 !border-2 !border-card !rounded-full !top-1/2 !-translate-y-1/2" />
      )}
    </div>
  );
};

export default memo(GroupNode);
