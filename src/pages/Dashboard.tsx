import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, Send, Clock, Smartphone, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";

const volumeData = [
  { hora: "08h", enviadas: 120, recebidas: 180 },
  { hora: "09h", enviadas: 200, recebidas: 250 },
  { hora: "10h", enviadas: 350, recebidas: 320 },
  { hora: "11h", enviadas: 280, recebidas: 300 },
  { hora: "12h", enviadas: 150, recebidas: 180 },
  { hora: "13h", enviadas: 180, recebidas: 200 },
  { hora: "14h", enviadas: 320, recebidas: 280 },
  { hora: "15h", enviadas: 400, recebidas: 350 },
  { hora: "16h", enviadas: 300, recebidas: 320 },
  { hora: "17h", enviadas: 250, recebidas: 200 },
];

const Dashboard = () => {
  const { data: stats, isLoading } = useDashboardStats();

  const statCards = [
    { label: "Conversas Ativas", value: stats?.activeConversations ?? 0, icon: MessageSquare },
    { label: "Mensagens Hoje", value: stats?.messagesToday ?? 0, icon: Send },
    { label: "Contatos", value: stats?.totalContacts ?? 0, icon: Users },
    { label: "Tempo Médio", value: "—", icon: Clock },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do seu WhatsApp</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                  {isLoading ? <Skeleton className="h-8 w-16 mt-1" /> : (
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  )}
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Volume de Mensagens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={volumeData}>
                <defs>
                  <linearGradient id="enviadas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 60%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 60%, 45%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="recebidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(210, 80%, 55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(210, 80%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 12%, 18%)" />
                <XAxis dataKey="hora" stroke="hsl(200, 10%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(200, 10%, 55%)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(200, 15%, 11%)", border: "1px solid hsl(200, 12%, 18%)", borderRadius: "8px", color: "hsl(200, 10%, 92%)" }} />
                <Area type="monotone" dataKey="enviadas" stroke="hsl(142, 60%, 45%)" fill="url(#enviadas)" strokeWidth={2} />
                <Area type="monotone" dataKey="recebidas" stroke="hsl(210, 80%, 55%)" fill="url(#recebidas)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-primary" />
              Instâncias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : stats?.instances.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma instância cadastrada</p>
            ) : (
              stats?.instances.map((inst) => (
                <div key={inst.id} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{inst.name}</p>
                    <p className="text-xs text-muted-foreground">{inst.phone || "Sem número"}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${inst.status === "connected" ? "bg-success animate-pulse-dot" : "bg-destructive"}`} />
                    <span className="text-xs text-muted-foreground capitalize">{inst.status}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
