import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, GitBranch, MessageSquare, Clock, Zap } from "lucide-react";

const fluxos = [
  { id: 1, name: "Boas-vindas", trigger: "Primeira mensagem", blocks: 5, active: true, instances: ["Vendas Principal"] },
  { id: 2, name: "Suporte FAQ", trigger: "Palavra-chave: ajuda", blocks: 12, active: true, instances: ["Suporte"] },
  { id: 3, name: "Qualificação de Leads", trigger: "Palavra-chave: preço", blocks: 8, active: false, instances: ["Vendas Principal", "Marketing"] },
  { id: 4, name: "Fora do Horário", trigger: "Fora do expediente", blocks: 3, active: true, instances: ["Vendas Principal", "Suporte"] },
];

const Automacoes = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Automações</h1>
          <p className="text-sm text-muted-foreground">Crie e gerencie seus fluxos de chatbot</p>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo Fluxo</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fluxos.map((f) => (
          <Card key={f.id} className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-primary" />
                  {f.name}
                </CardTitle>
                <Switch checked={f.active} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Zap className="h-3 w-3" />{f.trigger}</span>
                <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{f.blocks} blocos</span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {f.instances.map((inst) => (
                  <Badge key={inst} variant="secondary" className="text-[10px]">{inst}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Automacoes;
