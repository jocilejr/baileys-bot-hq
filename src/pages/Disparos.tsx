import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Send, Calendar, Users, CheckCheck } from "lucide-react";

const campanhas = [
  { id: 1, name: "Black Friday 2024", status: "completed", sent: 1200, delivered: 1180, read: 890, total: 1200, date: "25/11/2024" },
  { id: 2, name: "Promoção Janeiro", status: "sending", sent: 450, delivered: 430, read: 210, total: 800, date: "10/01/2025" },
  { id: 3, name: "Lançamento Produto X", status: "scheduled", sent: 0, delivered: 0, read: 0, total: 2000, date: "15/03/2026" },
  { id: 4, name: "Reativação Clientes", status: "draft", sent: 0, delivered: 0, read: 0, total: 500, date: "-" },
];

const statusMap: Record<string, { label: string; color: string }> = {
  completed: { label: "Concluída", color: "bg-success/20 text-success" },
  sending: { label: "Enviando", color: "bg-warning/20 text-warning" },
  scheduled: { label: "Agendada", color: "bg-info/20 text-info" },
  draft: { label: "Rascunho", color: "bg-muted text-muted-foreground" },
};

const Disparos = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Disparos em Massa</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas campanhas de envio</p>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova Campanha</Button>
      </div>

      <div className="space-y-4">
        {campanhas.map((c) => {
          const s = statusMap[c.status];
          const progress = c.total > 0 ? (c.sent / c.total) * 100 : 0;
          return (
            <Card key={c.id} className="bg-card border-border hover:border-primary/20 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Send className="h-4 w-4 text-primary" />
                      {c.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{c.date}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{c.total} destinatários</span>
                    </div>
                  </div>
                  <Badge className={`${s.color} border-0 text-[10px]`}>{s.label}</Badge>
                </div>
                {c.status !== "draft" && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-1.5" />
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Enviadas: {c.sent}</span>
                      <span>Entregues: {c.delivered}</span>
                      <span className="flex items-center gap-1"><CheckCheck className="h-3 w-3 text-info" />Lidas: {c.read}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Disparos;
