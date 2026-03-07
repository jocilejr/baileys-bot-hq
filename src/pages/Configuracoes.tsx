import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, MessageSquare, Globe, Wifi, WifiOff, Smartphone, Plus, RefreshCw, Trash2, QrCode, Loader2, Activity } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSettings, useUpdateSetting } from "@/hooks/useSettings";
import { useInstances, useCreateInstance, useDeleteInstance, useReconnectInstance, useBackendHealth } from "@/hooks/useInstances";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const Configuracoes = () => {
  const { data: settings, isLoading } = useSettings();
  const updateSetting = useUpdateSetting();
  const { toast } = useToast();

  const { data: instances, isLoading: loadingInstances } = useInstances();
  const createInstance = useCreateInstance();
  const deleteInstance = useDeleteInstance();
  const reconnectInstance = useReconnectInstance();
  const { data: health, isError: healthError } = useBackendHealth();

  const [welcomeMsg, setWelcomeMsg] = useState("");
  const [awayMsg, setAwayMsg] = useState("");
  const [hoursStart, setHoursStart] = useState("08:00");
  const [hoursEnd, setHoursEnd] = useState("18:00");
  const [newInstanceName, setNewInstanceName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (settings) {
      setWelcomeMsg(String(settings.welcome_message || "").replace(/"/g, ""));
      setAwayMsg(String(settings.away_message || "").replace(/"/g, ""));
      const bh = settings.business_hours as any;
      if (bh && typeof bh === "object") {
        setHoursStart(bh.start || "08:00");
        setHoursEnd(bh.end || "18:00");
      }
    }
  }, [settings]);

  const save = async (key: string, value: unknown) => {
    try {
      await updateSetting.mutateAsync({ key, value });
      toast({ title: "Configuração salva" });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  const handleCreateInstance = async () => {
    if (!newInstanceName) return;
    try {
      await createInstance.mutateAsync(newInstanceName);
      toast({ title: "Instância criada" });
      setDialogOpen(false);
      setNewInstanceName("");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  if (isLoading) return <div className="p-6"><Skeleton className="h-96 w-full" /></div>;

  const backendOnline = !!health && !healthError;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">Configure seu sistema ZapManager</p>
      </div>

      <Tabs defaultValue="baileys" className="space-y-4">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="baileys">Baileys</TabsTrigger>
          <TabsTrigger value="horario">Horário</TabsTrigger>
          <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="baileys">
          <div className="space-y-4">
            {/* Backend status */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Status do Backend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${backendOnline ? "bg-success animate-pulse-dot" : "bg-destructive"}`} />
                  <span className="text-sm text-foreground">
                    {backendOnline ? "Backend online" : "Backend offline"}
                  </span>
                  {backendOnline && health && (
                    <Badge variant="secondary" className="text-xs">
                      {health.activeSessions} sessão(ões) ativa(s)
                    </Badge>
                  )}
                </div>
                {backendOnline && health && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Uptime: {Math.floor(health.uptime / 60)}min
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Instances */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-primary" />
                    Instâncias WhatsApp
                  </CardTitle>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" disabled={!backendOnline}>
                        <Plus className="h-3 w-3 mr-1" />Nova
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Nova Instância</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Nome</Label>
                          <Input
                            value={newInstanceName}
                            onChange={(e) => setNewInstanceName(e.target.value)}
                            placeholder="Ex: Vendas Principal"
                            className="bg-secondary/50 border-border"
                          />
                        </div>
                        <Button onClick={handleCreateInstance} disabled={createInstance.isPending} className="w-full">
                          {createInstance.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Criar Instância
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loadingInstances ? (
                  <Skeleton className="h-20 w-full" />
                ) : !instances?.length ? (
                  <div className="text-center py-8">
                    <Smartphone className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma instância cadastrada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {instances.map((inst) => (
                      <div key={inst.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                        <div className="flex items-center gap-3">
                          <div className={`h-2.5 w-2.5 rounded-full ${inst.status === "connected" ? "bg-success" : inst.status === "qr_pending" ? "bg-warning" : "bg-destructive"}`} />
                          <div>
                            <p className="text-sm font-medium text-foreground">{inst.name}</p>
                            <p className="text-xs text-muted-foreground">{inst.phone || inst.status}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {inst.status === "qr_pending" && inst.qr_code && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm"><QrCode className="h-3 w-3" /></Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader><DialogTitle>Escaneie o QR Code</DialogTitle></DialogHeader>
                                <div className="flex justify-center p-4">
                                  <img src={inst.qr_code} alt="QR Code" className="h-64 w-64" />
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => reconnectInstance.mutate(inst.id)}
                            disabled={!backendOnline}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteInstance.mutate(inst.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="horario">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />Horário de Atendimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Início</Label>
                  <Input type="time" value={hoursStart} onChange={(e) => setHoursStart(e.target.value)} className="bg-secondary/50 border-0" />
                </div>
                <div className="space-y-2">
                  <Label>Fim</Label>
                  <Input type="time" value={hoursEnd} onChange={(e) => setHoursEnd(e.target.value)} className="bg-secondary/50 border-0" />
                </div>
              </div>
              <Button size="sm" onClick={() => save("business_hours", { start: hoursStart, end: hoursEnd, days: [1,2,3,4,5], timezone: "America/Sao_Paulo" })}>Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mensagens">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" />Mensagens Automáticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mensagem de Boas-vindas</Label>
                <Textarea value={welcomeMsg} onChange={(e) => setWelcomeMsg(e.target.value)} className="bg-secondary/50 border-0 min-h-[80px]" />
              </div>
              <div className="space-y-2">
                <Label>Mensagem Fora do Horário</Label>
                <Textarea value={awayMsg} onChange={(e) => setAwayMsg(e.target.value)} className="bg-secondary/50 border-0 min-h-[80px]" />
              </div>
              <Button size="sm" onClick={() => { save("welcome_message", welcomeMsg); save("away_message", awayMsg); }}>Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-primary" />Webhooks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>URL do Webhook (nova mensagem)</Label>
                <Input placeholder="https://..." className="bg-secondary/50 border-0" />
              </div>
              <div className="space-y-2">
                <Label>URL do Webhook (status da mensagem)</Label>
                <Input placeholder="https://..." className="bg-secondary/50 border-0" />
              </div>
              <Button size="sm">Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Configuracoes;
