import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Send, Calendar, Users, CheckCheck } from "lucide-react";
import { useCampaigns } from "@/hooks/useCampaigns";
import { Skeleton } from "@/components/ui/skeleton";

const statusMap: Record<string, { label: string; color: string }> = {
  completed: { label: "Concluída", color: "bg-success/20 text-success" },
  sending: { label: "Enviando", color: "bg-warning/20 text-warning" },
  scheduled: { label: "Agendada", color: "bg-info/20 text-info" },
  draft: { label: "Rascunho", color: "bg-muted text-muted-foreground" },
  paused: { label: "Pausada", color: "bg-warning/20 text-warning" },
  cancelled: { label: "Cancelada", color: "bg-destructive/20 text-destructive" },
};

const Disparos = () => {
  const { data: campanhas, isLoading } = useCampaigns();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Disparos em Massa</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas campanhas de envio</p>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova Campanha</Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : campanhas?.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Send className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma campanha criada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campanhas?.map((c) => {
            const s = statusMap[c.status] || statusMap.draft;
            const progress = (c.recipient_count ?? 0) > 0 ? ((c.sent_count ?? 0) / (c.recipient_count ?? 1)) * 100 : 0;
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
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {c.scheduled_at ? new Date(c.scheduled_at).toLocaleDateString("pt-BR") : "-"}
                        </span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{c.recipient_count ?? 0} destinatários</span>
                      </div>
                    </div>
                    <Badge className={`${s.color} border-0 text-[10px]`}>{s.label}</Badge>
                  </div>
                  {c.status !== "draft" && (
                    <div className="space-y-2">
                      <Progress value={progress} className="h-1.5" />
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Enviadas: {c.sent_count ?? 0}</span>
                        <span>Entregues: {c.delivered_count ?? 0}</span>
                        <span className="flex items-center gap-1"><CheckCheck className="h-3 w-3 text-info" />Lidas: {c.read_count ?? 0}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Disparos;
