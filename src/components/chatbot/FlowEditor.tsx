import { useCallback, useRef, useState, useEffect, type DragEvent } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { FlowNodeType, FlowNodeData } from "@/types/chatbot";
import { getDefaultNodeData } from "@/types/chatbot";
import StepNode from "./StepNode";
import GroupNode from "./GroupNode";
import NodePalette from "./NodePalette";
import PropertiesPanel from "./PropertiesPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import type { FlowNode, FlowEdge } from "@/types/chatbot";
import { toast } from "sonner";

const nodeTypes = { stepNode: StepNode, groupNode: GroupNode };

const DOCK_THRESHOLD = 80;
const GROUP_PADDING = 40;
const GROUP_HEADER = 40;

interface Props {
  flowId: string;
  flowName: string;
  initialNodes: FlowNode[];
  initialEdges: FlowEdge[];
  onSave: (data: { name: string; nodes: FlowNode[]; edges: FlowEdge[] }) => Promise<void>;
  onBack: () => void;
}

export default function FlowEditor({ flowId, flowName, initialNodes, initialEdges, onSave, onBack }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [name, setName] = useState(flowName);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const rfInstance = useRef<ReactFlowInstance | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) as FlowNode | undefined;

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: "hsl(142 60% 45%)" } }, eds));
  }, [setEdges]);

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("application/reactflow") as FlowNodeType;
      if (!type || !rfInstance.current || !wrapperRef.current) return;

      const bounds = wrapperRef.current.getBoundingClientRect();
      const position = rfInstance.current.screenToFlowPosition({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });

      if (type === "group") {
        const newNode: FlowNode = {
          id: `group_${Date.now()}`,
          type: "groupNode",
          position,
          data: getDefaultNodeData("group") as any,
          style: { width: 350, height: 250 },
        };
        setNodes((nds) => [...nds, newNode]);
      } else {
        const newNode: FlowNode = {
          id: `node_${Date.now()}`,
          type: "stepNode",
          position,
          data: getDefaultNodeData(type) as any,
        };
        setNodes((nds) => [...nds, newNode]);
      }
    },
    [setNodes]
  );

  const onNodeClick = useCallback((_: any, node: FlowNode) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleNodeDataChange = useCallback((id: string, partial: Partial<FlowNodeData>) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...partial } } : n))
    );
  }, [setNodes]);

  const handleDeleteNode = useCallback((id: string) => {
    // If deleting a group, unparent children first
    setNodes((nds) => {
      const group = nds.find((n) => n.id === id);
      if (group?.type === "groupNode") {
        return nds
          .filter((n) => n.id !== id)
          .map((n) => {
            if (n.parentId === id) {
              return {
                ...n,
                parentId: undefined,
                position: {
                  x: n.position.x + (group.position?.x || 0),
                  y: n.position.y + (group.position?.y || 0),
                },
              };
            }
            return n;
          });
      }
      return nds.filter((n) => n.id !== id);
    });
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setSelectedNodeId(null);
  }, [setNodes, setEdges]);

  // Docking logic: when a stepNode is dropped near another stepNode or group
  const onNodeDragStop = useCallback((_event: any, draggedNode: any) => {
    if (draggedNode.type !== "stepNode") return;

    setNodes((nds) => {
      const dragged = nds.find((n) => n.id === draggedNode.id);
      if (!dragged) return nds;

      // Absolute position of dragged node
      const draggedAbsX = dragged.parentId
        ? (nds.find((n) => n.id === dragged.parentId)?.position?.x || 0) + dragged.position.x
        : dragged.position.x;
      const draggedAbsY = dragged.parentId
        ? (nds.find((n) => n.id === dragged.parentId)?.position?.y || 0) + dragged.position.y
        : dragged.position.y;

      // Check if near an existing group
      for (const node of nds) {
        if (node.type !== "groupNode" || node.id === dragged.parentId) continue;
        const gx = node.position.x;
        const gy = node.position.y;
        const gw = (node.style?.width as number) || 350;
        const gh = (node.style?.height as number) || 250;

        if (
          draggedAbsX > gx - DOCK_THRESHOLD &&
          draggedAbsX < gx + gw + DOCK_THRESHOLD &&
          draggedAbsY > gy - DOCK_THRESHOLD &&
          draggedAbsY < gy + gh + DOCK_THRESHOLD
        ) {
          // Dock into this group
          return nds.map((n) => {
            if (n.id === dragged.id) {
              return {
                ...n,
                parentId: node.id,
                extent: "parent" as const,
                position: {
                  x: draggedAbsX - gx,
                  y: draggedAbsY - gy,
                },
              };
            }
            return n;
          });
        }
      }

      // Check if near another stepNode (not in a group) to create a new group
      if (!dragged.parentId) {
        for (const node of nds) {
          if (node.id === dragged.id || node.type !== "stepNode" || node.parentId) continue;
          const dist = Math.sqrt(
            Math.pow(draggedAbsX - node.position.x, 2) + Math.pow(draggedAbsY - node.position.y, 2)
          );
          if (dist < DOCK_THRESHOLD) {
            // Create group
            const groupId = `group_${Date.now()}`;
            const minX = Math.min(draggedAbsX, node.position.x) - GROUP_PADDING;
            const minY = Math.min(draggedAbsY, node.position.y) - GROUP_HEADER - GROUP_PADDING;
            const maxX = Math.max(draggedAbsX, node.position.x) + 280 + GROUP_PADDING;
            const maxY = Math.max(draggedAbsY, node.position.y) + 150 + GROUP_PADDING;

            const groupNode: FlowNode = {
              id: groupId,
              type: "groupNode",
              position: { x: minX, y: minY },
              data: { type: "group", label: "Grupo", groupTitle: "Novo Grupo" } as any,
              style: { width: maxX - minX, height: maxY - minY },
            };

            return [
              groupNode,
              ...nds.map((n) => {
                if (n.id === dragged.id || n.id === node.id) {
                  return {
                    ...n,
                    parentId: groupId,
                    extent: "parent" as const,
                    position: {
                      x: (n.id === dragged.id ? draggedAbsX : node.position.x) - minX,
                      y: (n.id === dragged.id ? draggedAbsY : node.position.y) - minY,
                    },
                  };
                }
                return n;
              }),
            ];
          }
        }
      }

      // If dragged out of a group
      if (dragged.parentId) {
        const parent = nds.find((n) => n.id === dragged.parentId);
        if (parent) {
          const px = parent.position.x;
          const py = parent.position.y;
          const pw = (parent.style?.width as number) || 350;
          const ph = (parent.style?.height as number) || 250;

          if (
            draggedAbsX < px - DOCK_THRESHOLD / 2 ||
            draggedAbsX > px + pw + DOCK_THRESHOLD / 2 ||
            draggedAbsY < py - DOCK_THRESHOLD / 2 ||
            draggedAbsY > py + ph + DOCK_THRESHOLD / 2
          ) {
            // Undock
            const updated = nds.map((n) => {
              if (n.id === dragged.id) {
                return {
                  ...n,
                  parentId: undefined,
                  extent: undefined,
                  position: { x: draggedAbsX, y: draggedAbsY },
                };
              }
              return n;
            });
            // Clean up empty groups
            const groupId = dragged.parentId;
            const remainingChildren = updated.filter((n) => n.parentId === groupId);
            if (remainingChildren.length === 0) {
              return updated.filter((n) => n.id !== groupId);
            }
            return updated;
          }
        }
      }

      return nds;
    });
  }, [setNodes]);

  // Listen for ungroup events from GroupNode
  useEffect(() => {
    const handler = (e: Event) => {
      const { groupId } = (e as CustomEvent).detail;
      setNodes((nds) => {
        const group = nds.find((n) => n.id === groupId);
        if (!group) return nds;
        return nds
          .filter((n) => n.id !== groupId)
          .map((n) => {
            if (n.parentId === groupId) {
              return {
                ...n,
                parentId: undefined,
                extent: undefined,
                position: {
                  x: n.position.x + (group.position?.x || 0),
                  y: n.position.y + (group.position?.y || 0),
                },
              };
            }
            return n;
          });
      });
    };
    document.addEventListener("ungroup-nodes", handler);
    return () => document.removeEventListener("ungroup-nodes", handler);
  }, [setNodes]);

  // Listen for group title changes
  useEffect(() => {
    const handler = (e: Event) => {
      const { id, title } = (e as CustomEvent).detail;
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, groupTitle: title, label: title } } : n))
      );
    };
    document.addEventListener("group-title-change", handler);
    return () => document.removeEventListener("group-title-change", handler);
  }, [setNodes]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ name, nodes: nodes as FlowNode[], edges: edges as FlowEdge[] });
      toast.success("Fluxo salvo com sucesso");
    } catch {
      toast.error("Erro ao salvar fluxo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-card">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 w-64 text-sm font-medium"
        />
        <div className="flex-1" />
        <Button size="sm" className="h-8" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
          Salvar
        </Button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Palette */}
        <div className="w-56 border-r bg-card flex-shrink-0">
          <NodePalette />
        </div>

        {/* Canvas */}
        <div className="flex-1" ref={wrapperRef}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onNodeClick={onNodeClick as any}
            onPaneClick={onPaneClick}
            onNodeDragStop={onNodeDragStop as any}
            onInit={(instance) => { rfInstance.current = instance; }}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode={["Backspace", "Delete"]}
            defaultEdgeOptions={{ animated: true, style: { stroke: "hsl(142 60% 45%)", strokeWidth: 2 } }}
            className="bg-background"
          >
            <Controls className="!bg-card !border-border !shadow-md" />
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="!bg-background" />
          </ReactFlow>
        </div>

        {/* Properties */}
        {selectedNode && (
          <PropertiesPanel
            node={selectedNode}
            onChange={handleNodeDataChange}
            onDelete={handleDeleteNode}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>
    </div>
  );
}
