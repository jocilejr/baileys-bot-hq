import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, Send, Clock, Smartphone, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const stats = [
  { label: "Conversas Ativas", value: "127", icon: MessageSquare, change: "+12%" },
  { label: "Mensagens Hoje", value: "2.458", icon: Send, change: "+8%" },
  { label: "Contatos", value: "4.392", icon: Users, change: "+3%" },
  { label: "Tempo Médio", value: "2m 34s", icon: Clock, change: "-15%" },
];

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

const instances = [
  { name: "Vendas Principal", number: "+55 11 9999-0001", status: "online" },
  { name: "Suporte", number: "+55 11 9999-0002", status: "online" },
  { name: "Marketing", number: "+55 11 9999-0003", status: "offline" },
];

const Dashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do seu WhatsApp</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  <span className={`text-xs font-medium ${stat.change.startsWith("+") ? "text-success" : "text-info"}`}>
                    {stat.change}
                  </span>
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
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(200, 15%, 11%)",
                    border: "1px solid hsl(200, 12%, 18%)",
                    borderRadius: "8px",
                    color: "hsl(200, 10%, 92%)",
                  }}
                />
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
            {instances.map((inst) => (
              <div key={inst.name} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{inst.name}</p>
                  <p className="text-xs text-muted-foreground">{inst.number}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${inst.status === "online" ? "bg-success animate-pulse-dot" : "bg-destructive"}`} />
                  <span className="text-xs text-muted-foreground capitalize">{inst.status}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
