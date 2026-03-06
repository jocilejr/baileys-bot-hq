import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, GitBranch, MessageSquare, Zap } from "lucide-react";
import { useAutomations, useToggleAutomation } from "@/hooks/useAutomations";
import { Skeleton } from "@/components/ui/skeleton";

const triggerLabels: Record<string, string> = {
  keyword: "Palavra-chave",
  first_message: "Primeira mensagem",
  schedule: "Agendado",
  webhook: "Webhook",
};

const Automacoes = () => {
  const { data: fluxos, isLoading } = useAutomations();
  const toggleAutomation = useToggleAutomation();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Automações</h1>
          <p className="text-sm text-muted-foreground">Crie e gerencie seus fluxos de chatbot</p>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo Fluxo</Button>
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
            const blocks = Array.isArray(f.blocks) ? f.blocks : [];
            return (
              <Card key={f.id} className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-primary" />
                      {f.name}
                    </CardTitle>
                    <Switch
                      checked={f.active ?? false}
                      onCheckedChange={(checked) => toggleAutomation.mutate({ id: f.id, active: checked })}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {triggerLabels[f.trigger_type] || f.trigger_type}
                      {f.trigger_value ? `: ${f.trigger_value}` : ""}
                    </span>
                    <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{blocks.length} blocos</span>
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
