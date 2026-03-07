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
import { getDefaultNodeData, BLOCK_FINISHERS } from "@/types/chatbot";
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

interface Props {
  flowId: string;
  flowName: string;
  initialNodes: FlowNode[];
  initialEdges: FlowEdge[];
  onSave: (data: { name: string; nodes: FlowNode[]; edges: FlowEdge[] }) => Promise<void>;
  onBack: () => void;
}

// Helper: extract FlowNodeData from a node
function extractStepData(node: FlowNode): FlowNodeData {
  const d = node.data as unknown as FlowNodeData;
  return { ...d, stepId: node.id };
}

export default function FlowEditor({ flowId, flowName, initialNodes, initialEdges, onSave, onBack }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [name, setName] = useState(flowName);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedStepContext, setSelectedStepContext] = useState<{ groupId: string; stepIndex: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const rfInstance = useRef<ReactFlowInstance | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Derive selectedNode - either a real node or a virtual step inside a group
  const selectedNode = (() => {
    if (selectedStepContext) {
      const group = nodes.find((n) => n.id === selectedStepContext.groupId);
      if (group) {
        const groupData = group.data as unknown as FlowNodeData;
        const step = groupData.steps?.[selectedStepContext.stepIndex];
        if (step) {
          // Create a virtual FlowNode for the properties panel
          return {
            id: step.stepId || `${selectedStepContext.groupId}_step_${selectedStepContext.stepIndex}`,
            type: "stepNode",
            position: { x: 0, y: 0 },
            data: step,
          } as FlowNode;
        }
      }
    }
    return nodes.find((n) => n.id === selectedNodeId) as FlowNode | undefined;
  })();

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({ ...params, type: "smoothstep", style: { stroke: "hsl(var(--muted-foreground) / 0.35)", strokeWidth: 1.5 } }, eds));
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

      const newNode: FlowNode = {
        id: `node_${Date.now()}`,
        type: "stepNode",
        position,
        data: getDefaultNodeData(type) as any,
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  const onNodeClick = useCallback((_: any, node: FlowNode) => {
    setSelectedStepContext(null);
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedStepContext(null);
  }, []);

  const handleNodeDataChange = useCallback((id: string, partial: Partial<FlowNodeData>) => {
    // Check if this is a step inside a group
    if (selectedStepContext) {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === selectedStepContext.groupId) {
            const groupData = n.data as unknown as FlowNodeData;
            const steps = [...(groupData.steps || [])];
            steps[selectedStepContext.stepIndex] = { ...steps[selectedStepContext.stepIndex], ...partial };
            return { ...n, data: { ...n.data, steps } };
          }
          return n;
        })
      );
      return;
    }
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...partial } } : n))
    );
  }, [setNodes, selectedStepContext]);

  const handleDeleteNode = useCallback((id: string) => {
    // If deleting a step inside a group
    if (selectedStepContext) {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === selectedStepContext.groupId) {
            const groupData = n.data as unknown as FlowNodeData;
            const steps = [...(groupData.steps || [])];
            steps.splice(selectedStepContext.stepIndex, 1);
            // If group becomes empty, remove it
            if (steps.length === 0) {
              return null as any;
            }
            // If only 1 step left, convert back to standalone node
            if (steps.length === 1) {
              const step = steps[0];
              return {
                ...n,
                type: "stepNode",
                data: { ...step, stepId: undefined } as any,
              };
            }
            return { ...n, data: { ...n.data, steps } };
          }
          return n;
        }).filter(Boolean)
      );
      setSelectedStepContext(null);
      setSelectedNodeId(null);
      return;
    }

    // If deleting a group, restore steps as individual nodes
    setNodes((nds) => {
      const group = nds.find((n) => n.id === id);
      if (group?.type === "groupNode") {
        const groupData = group.data as unknown as FlowNodeData;
        const steps = groupData.steps || [];
        const newNodes = steps.map((step, i) => ({
          id: step.stepId || `restored_${Date.now()}_${i}`,
          type: "stepNode" as const,
          position: {
            x: (group.position?.x || 0) + 20,
            y: (group.position?.y || 0) + i * 100,
          },
          data: { ...step, stepId: undefined } as any,
        }));
        return [...nds.filter((n) => n.id !== id), ...newNodes];
      }
      return nds.filter((n) => n.id !== id);
    });
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setSelectedNodeId(null);
  }, [setNodes, setEdges, selectedStepContext]);

  // Docking: when a stepNode is dropped near another stepNode or groupNode
  const onNodeDragStop = useCallback((_event: any, draggedNode: any) => {
    if (draggedNode.type !== "stepNode") return;

    setNodes((nds) => {
      const dragged = nds.find((n) => n.id === draggedNode.id);
      if (!dragged) return nds;

      const draggedX = dragged.position.x;
      const draggedY = dragged.position.y;

      // Check if near an existing group
      for (const node of nds) {
        if (node.type !== "groupNode" || node.id === dragged.id) continue;
        const gx = node.position.x;
        const gy = node.position.y;
        const dist = Math.sqrt(Math.pow(draggedX - gx, 2) + Math.pow(draggedY - gy, 2));

        if (dist < DOCK_THRESHOLD * 2) {
          // Check if group is sealed
          const groupData = node.data as unknown as FlowNodeData;
          const steps = [...(groupData.steps || [])];
          if (steps.length > 0 && BLOCK_FINISHERS.includes(steps[steps.length - 1].type)) {
            continue;
          }
          steps.push(extractStepData(dragged as FlowNode));

          return nds
            .filter((n) => n.id !== dragged.id)
            .map((n) => {
              if (n.id === node.id) {
                return { ...n, data: { ...n.data, steps } };
              }
              return n;
            });
        }
      }

      // Check if near another stepNode to create a new group
      for (const node of nds) {
        if (node.id === dragged.id || node.type !== "stepNode") continue;
        const dist = Math.sqrt(
          Math.pow(draggedX - node.position.x, 2) + Math.pow(draggedY - node.position.y, 2)
        );
        if (dist < DOCK_THRESHOLD) {
          // Create group from both nodes
          const groupId = `group_${Date.now()}`;
          const midX = Math.min(draggedX, node.position.x);
          const midY = Math.min(draggedY, node.position.y);

          const step1 = extractStepData(node as FlowNode);
          const step2 = extractStepData(dragged as FlowNode);

          const groupNode: FlowNode = {
            id: groupId,
            type: "groupNode",
            position: { x: midX, y: midY },
            data: {
              type: "group",
              label: "Grupo",
              groupTitle: "Novo Grupo",
              steps: [step1, step2],
            } as any,
          };

          // Transfer edges from old nodes to group
          // We'll handle this separately via edges

          return [
            ...nds.filter((n) => n.id !== dragged.id && n.id !== node.id),
            groupNode,
          ];
        }
      }

      return nds;
    });

    // Transfer edges when grouping
    setEdges((eds) => {
      // This will be handled by the nodes state update
      return eds;
    });
  }, [setNodes, setEdges]);

  // Listen for ungroup events
  useEffect(() => {
    const handler = (e: Event) => {
      const { groupId } = (e as CustomEvent).detail;
      setNodes((nds) => {
        const group = nds.find((n) => n.id === groupId);
        if (!group) return nds;
        const groupData = group.data as unknown as FlowNodeData;
        const steps = groupData.steps || [];

        const newNodes = steps.map((step, i) => ({
          id: step.stepId || `ungrouped_${Date.now()}_${i}`,
          type: "stepNode" as const,
          position: {
            x: (group.position?.x || 0) + 20,
            y: (group.position?.y || 0) + i * 100,
          },
          data: { ...step, stepId: undefined } as any,
        }));

        return [...nds.filter((n) => n.id !== groupId), ...newNodes];
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

  // Listen for step selection within groups
  useEffect(() => {
    const handler = (e: Event) => {
      const { groupId, stepIndex } = (e as CustomEvent).detail;
      setSelectedNodeId(null);
      setSelectedStepContext({ groupId, stepIndex });
    };
    document.addEventListener("group-step-select", handler);
    return () => document.removeEventListener("group-step-select", handler);
  }, []);

  // Listen for step removal from groups
  useEffect(() => {
    const handler = (e: Event) => {
      const { groupId, stepIndex } = (e as CustomEvent).detail;
      setNodes((nds) => {
        const group = nds.find((n) => n.id === groupId);
        if (!group) return nds;

        const groupData = group.data as unknown as FlowNodeData;
        const steps = [...(groupData.steps || [])];
        const removed = steps.splice(stepIndex, 1)[0];

        // Create restored standalone node
        const restoredNode: FlowNode = {
          id: removed.stepId || `restored_${Date.now()}`,
          type: "stepNode",
          position: {
            x: (group.position?.x || 0) + 340,
            y: (group.position?.y || 0) + stepIndex * 80,
          },
          data: { ...removed, stepId: undefined } as any,
        };

        let updatedNodes = nds.filter((n) => n.id !== groupId);

        if (steps.length === 0) {
          // Group empty - just add restored
        } else if (steps.length === 1) {
          // Convert last step back to standalone
          const lastStep = steps[0];
          updatedNodes.push({
            id: lastStep.stepId || groupId,
            type: "stepNode",
            position: { x: group.position?.x || 0, y: group.position?.y || 0 },
            data: { ...lastStep, stepId: undefined } as any,
          } as FlowNode);
        } else {
          // Keep group with remaining steps
          updatedNodes.push({ ...group, data: { ...group.data, steps } } as FlowNode);
        }

        updatedNodes.push(restoredNode as FlowNode);
        return updatedNodes;
      });
    };
    document.addEventListener("group-step-remove", handler);
    return () => document.removeEventListener("group-step-remove", handler);
  }, [setNodes]);

  // Listen for step reorder within groups
  useEffect(() => {
    const handler = (e: Event) => {
      const { groupId, fromIndex, toIndex } = (e as CustomEvent).detail;
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === groupId) {
            const groupData = n.data as unknown as FlowNodeData;
            const steps = [...(groupData.steps || [])];
            const [moved] = steps.splice(fromIndex as number, 1);
            steps.splice(toIndex as number, 0, moved);
            return { ...n, data: { ...n.data, steps } };
          }
          return n;
        })
      );
    };
    document.addEventListener("group-step-reorder", handler);
    return () => document.removeEventListener("group-step-reorder", handler);
  }, [setNodes]);

  // Listen for add step to group
  useEffect(() => {
    const handler = (e: Event) => {
      const { groupId } = (e as CustomEvent).detail;
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === groupId) {
            const groupData = n.data as unknown as FlowNodeData;
            const steps = [...(groupData.steps || [])];
            // Block if sealed
            if (steps.length > 0 && BLOCK_FINISHERS.includes(steps[steps.length - 1].type)) {
              return n;
            }
            const newStep = getDefaultNodeData("sendText");
            newStep.stepId = `step_${Date.now()}`;
            steps.push(newStep);
            return { ...n, data: { ...n.data, steps } };
          }
          return n;
        })
      );
    };
    document.addEventListener("group-add-step", handler);
    return () => document.removeEventListener("group-add-step", handler);
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
            defaultEdgeOptions={{ type: "smoothstep", style: { stroke: "hsl(var(--muted-foreground) / 0.35)", strokeWidth: 1.5 } }}
            connectionLineStyle={{ stroke: "hsl(var(--primary) / 0.5)", strokeWidth: 1.5 }}
            className="bg-background"
          >
            <Controls className="!bg-card !border-border/50 !shadow-sm !rounded-lg" />
            <Background variant={BackgroundVariant.Dots} gap={24} size={0.5} className="!bg-background" />
          </ReactFlow>
        </div>

        {/* Properties */}
        {selectedNode && (
          <PropertiesPanel
            node={selectedNode}
            onChange={handleNodeDataChange}
            onDelete={handleDeleteNode}
            onClose={() => {
              setSelectedNodeId(null);
              setSelectedStepContext(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
