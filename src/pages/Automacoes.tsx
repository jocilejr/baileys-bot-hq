import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, GitBranch, MessageSquare, Zap, Trash2 } from "lucide-react";
import { useAutomations, useCreateAutomation, useToggleAutomation, useUpdateAutomation, useDeleteAutomation } from "@/hooks/useAutomations";
import { Skeleton } from "@/components/ui/skeleton";
import FlowEditor from "@/components/chatbot/FlowEditor";
import type { FlowNode, FlowEdge } from "@/types/chatbot";
import { defaultNodeData } from "@/types/chatbot";
import { toast } from "sonner";

const triggerLabels: Record<string, string> = {
  keyword: "Palavra-chave",
  first_message: "Primeira mensagem",
  schedule: "Agendado",
  webhook: "Webhook",
};

const Automacoes = () => {
  const { data: fluxos, isLoading } = useAutomations();
  const toggleAutomation = useToggleAutomation();
  const createAutomation = useCreateAutomation();
  const updateAutomation = useUpdateAutomation();
  const deleteAutomation = useDeleteAutomation();
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);

  const editingFlow = fluxos?.find((f) => f.id === editingFlowId);

  const handleNewFlow = async () => {
    try {
      const defaultNodes: FlowNode[] = [
        {
          id: "node_trigger",
          type: "step",
          position: { x: 300, y: 50 },
          data: { type: "trigger", label: "Gatilho", ...defaultNodeData.trigger } as any,
        },
      ];
      const result = await createAutomation.mutateAsync({
        name: "Novo Fluxo",
        nodes: defaultNodes as any,
        edges: [] as any,
      });
      setEditingFlowId(result.id);
    } catch {
      toast.error("Erro ao criar fluxo");
    }
  };

  const handleSave = async ({ name, nodes, edges }: { name: string; nodes: FlowNode[]; edges: FlowEdge[] }) => {
    if (!editingFlowId) return;
    await updateAutomation.mutateAsync({ id: editingFlowId, name, nodes, edges });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Excluir este fluxo?")) return;
    try {
      await deleteAutomation.mutateAsync(id);
      toast.success("Fluxo excluído");
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  if (editingFlow) {
    const initialNodes = Array.isArray(editingFlow.nodes) ? (editingFlow.nodes as unknown as FlowNode[]) : [];
    const initialEdges = Array.isArray(editingFlow.edges) ? (editingFlow.edges as unknown as FlowEdge[]) : [];

    return (
      <div className="h-[calc(100vh-4rem)]">
        <FlowEditor
          flowId={editingFlow.id}
          flowName={editingFlow.name}
          initialNodes={initialNodes}
          initialEdges={initialEdges}
          onSave={handleSave}
          onBack={() => setEditingFlowId(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Automações</h1>
          <p className="text-sm text-muted-foreground">Crie e gerencie seus fluxos de chatbot</p>
        </div>
        <Button size="sm" onClick={handleNewFlow} disabled={createAutomation.isPending}>
          <Plus className="h-4 w-4 mr-1" />Novo Fluxo
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 w-full" />)}
        </div>
      ) : fluxos?.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum fluxo de automação</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fluxos?.map((f) => {
            const nodesArr = Array.isArray(f.nodes) ? f.nodes : [];
            return (
              <Card
                key={f.id}
                className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => setEditingFlowId(f.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-primary" />
                      {f.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={f.active ?? false}
                        onCheckedChange={(checked) => { toggleAutomation.mutate({ id: f.id, active: checked }); }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handleDelete(f.id, e)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {triggerLabels[f.trigger_type] || f.trigger_type}
                      {f.trigger_value ? `: ${f.trigger_value}` : ""}
                    </span>
                    <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{nodesArr.length} blocos</span>
                  </div>
                  {f.description && <p className="text-xs text-muted-foreground">{f.description}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Automacoes;
