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
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { FlowNodeType, FlowNodeData } from "@/types/chatbot";
import { getDefaultNodeData } from "@/types/chatbot";
import StepNode from "./StepNode";
import NodePalette from "./NodePalette";
import PropertiesPanel from "./PropertiesPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import type { FlowNode, FlowEdge } from "@/types/chatbot";
import { toast } from "sonner";

const nodeTypes = { stepNode: StepNode };

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
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setSelectedNodeId(null);
  }, [setNodes, setEdges]);

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
