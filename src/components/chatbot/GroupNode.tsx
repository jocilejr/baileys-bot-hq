import { memo, useState } from "react";
import { type NodeProps, NodeResizer } from "@xyflow/react";
import type { FlowNodeData } from "@/types/chatbot";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Ungroup, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupNodeProps extends NodeProps {
  data: Record<string, unknown>;
}

const GroupNode = ({ data, selected, id }: GroupNodeProps) => {
  const nodeData = data as unknown as FlowNodeData;
  const [editing, setEditing] = useState(false);
  const title = nodeData.groupTitle || nodeData.label || "Grupo";

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 border-dashed bg-muted/20 min-w-[300px] min-h-[200px] w-full h-full",
        selected ? "border-primary/60 bg-primary/5" : "border-border/50"
      )}
    >
      <NodeResizer
        minWidth={300}
        minHeight={200}
        isVisible={selected}
        lineClassName="!border-primary/40"
        handleClassName="!w-2.5 !h-2.5 !bg-primary !border-2 !border-background !rounded-sm"
      />

      <div className="absolute top-0 left-0 right-0 flex items-center gap-2 px-3 py-1.5 rounded-t-xl bg-muted/40 border-b border-dashed border-border/30">
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 cursor-grab" />
        {editing ? (
          <Input
            autoFocus
            defaultValue={title}
            className="h-6 text-xs bg-transparent border-none px-1 focus-visible:ring-0"
            onBlur={(e) => {
              setEditing(false);
              // trigger onChange via custom event
              const event = new CustomEvent("group-title-change", {
                detail: { id, title: e.target.value },
                bubbles: true,
              });
              e.target.dispatchEvent(event);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
          />
        ) : (
          <span
            className="text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            onDoubleClick={() => setEditing(true)}
          >
            {title}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-destructive"
            title="Desagrupar"
            onClick={(e) => {
              e.stopPropagation();
              const event = new CustomEvent("ungroup-nodes", {
                detail: { groupId: id },
                bubbles: true,
              });
              (e.target as HTMLElement).dispatchEvent(event);
            }}
          >
            <Ungroup className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default memo(GroupNode);
