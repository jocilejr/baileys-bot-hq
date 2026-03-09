import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, MessageSquare, Globe, Smartphone, Plus, RefreshCw, Trash2, QrCode, Loader2, Activity, CheckCircle2, Wifi, WifiOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSettings, useUpdateSetting } from "@/hooks/useSettings";
import { useInstances, useCreateInstance, useDeleteInstance, useReconnectInstance, useBackendHealth, useRealtimeInstances } from "@/hooks/useInstances";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { QRCodeDisplay } from "@/components/instances/QRCodeDisplay";

const Configuracoes = () => {
  const { data: settings, isLoading } = useSettings();
  const updateSetting = useUpdateSetting();
  const { toast } = useToast();

  const { data: instances, isLoading: loadingInstances } = useInstances();
  const createInstance = useCreateInstance();
  const deleteInstance = useDeleteInstance();
  const reconnectInstance = useReconnectInstance();
  const { data: health, isError: healthError } = useBackendHealth();

  useRealtimeInstances();

  const [welcomeMsg, setWelcomeMsg] = useState("");
  const [awayMsg, setAwayMsg] = useState("");
  const [hoursStart, setHoursStart] = useState("08:00");
  const [hoursEnd, setHoursEnd] = useState("18:00");
  const [newInstanceName, setNewInstanceName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrDialogInstanceId, setQrDialogInstanceId] = useState<string | null>(null);

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

  // Auto-close QR dialog when connected
  useEffect(() => {
    if (!qrDialogInstanceId || !instances) return;
    const inst = instances.find((i) => i.id === qrDialogInstanceId);
    if (inst?.status === "connected") {
      setTimeout(() => {
        setQrDialogInstanceId(null);
        toast({ title: "✅ WhatsApp conectado com sucesso!" });
      }, 1500);
    }
  }, [instances, qrDialogInstanceId, toast]);

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
      const result = await createInstance.mutateAsync(newInstanceName);
      setDialogOpen(false);
      setNewInstanceName("");
      if (result?.id) {
        setQrDialogInstanceId(result.id);
        toast({ title: "Instância criada! Aguarde o QR Code..." });
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleConnect = async (instanceId: string) => {
    try {
      setQrDialogInstanceId(instanceId);
      await reconnectInstance.mutateAsync(instanceId);
    } catch (e: any) {
      toast({ title: "Erro ao conectar", description: e.message, variant: "destructive" });
      setQrDialogInstanceId(null);
    }
  };

  if (isLoading) return <div className="p-6"><Skeleton className="h-96 w-full" /></div>;

  const backendOnline = !!health && !healthError;
  const qrInstance = instances?.find((i) => i.id === qrDialogInstanceId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return "bg-success";
      case "qr_pending": return "bg-warning animate-pulse";
      case "connecting": return "bg-warning animate-pulse";
      default: return "bg-destructive";
    }
  };

  const getStatusLabel = (status: string, phone: string | null) => {
    switch (status) {
      case "connected": return phone || "Conectado";
      case "qr_pending": return "Aguardando leitura do QR";
      case "connecting": return "Conectando...";
      default: return "Desconectado";
    }
  };

  const isConnecting = (status: string) => status === "qr_pending" || status === "connecting";

  // QR dialog content: 3 states
  const renderQrContent = () => {
    if (!qrInstance) return (
      <div className="flex flex-col items-center gap-3 py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Iniciando conexão...</p>
      </div>
    );

    if (qrInstance.status === "connected") return (
      <div className="flex flex-col items-center gap-4 py-10">
        <CheckCircle2 className="h-16 w-16 text-success" />
        <p className="text-lg font-semibold text-foreground">Conectado!</p>
        <p className="text-sm text-muted-foreground">{qrInstance.phone || "WhatsApp vinculado com sucesso"}</p>
      </div>
    );

    if (qrInstance.qr_code) return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <img src={qrInstance.qr_code} alt="QR Code" className="w-64 h-64 rounded-xl border border-border" />
          <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs">
            Pronto
          </Badge>
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-foreground">Escaneie com o WhatsApp</p>
          <p className="text-xs text-muted-foreground">
            Abra o WhatsApp → Menu → Aparelhos conectados → Conectar aparelho
          </p>
          <p className="text-xs text-muted-foreground opacity-60">O QR atualiza automaticamente a cada ~20s</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => reconnectInstance.mutate(qrInstance.id)}
          disabled={reconnectInstance.isPending}
          className="w-full"
        >
          {reconnectInstance.isPending
            ? <><Loader2 className="h-3 w-3 animate-spin mr-2" />Atualizando QR...</>
            : <><RefreshCw className="h-3 w-3 mr-2" />Gerar novo QR</>}
        </Button>
      </div>
    );

    // Generating state (no QR yet)
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="relative w-64 h-64 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-secondary/20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">Gerando QR Code...</p>
            <p className="text-xs text-muted-foreground text-center px-4">Aguarde enquanto conectamos ao WhatsApp</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">Configure seu sistema ZapManager</p>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={!!qrDialogInstanceId} onOpenChange={(open) => !open && setQrDialogInstanceId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <QrCode className="h-4 w-4 text-primary" />
              {qrInstance?.status === "connected" ? "Conectado!" : "Conectar WhatsApp"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {renderQrContent()}
          </div>
        </DialogContent>
      </Dialog>

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
                            onKeyDown={(e) => e.key === "Enter" && handleCreateInstance()}
                            placeholder="Ex: Vendas Principal"
                            className="bg-secondary/50 border-border"
                          />
                        </div>
                        <Button onClick={handleCreateInstance} disabled={createInstance.isPending || !newInstanceName} className="w-full">
                          {createInstance.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Criar e Conectar
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
                    <p className="text-xs text-muted-foreground mt-1">Clique em "Nova" para adicionar</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {instances.map((inst) => (
                      <div key={inst.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                        <div className="flex items-center gap-3">
                          <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${getStatusColor(inst.status)}`} />
                          <div>
                            <p className="text-sm font-medium text-foreground">{inst.name}</p>
                            <p className="text-xs text-muted-foreground">{getStatusLabel(inst.status, inst.phone)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Botão Ver QR — apenas quando qr_pending com QR disponível */}
                          {inst.status === "qr_pending" && inst.qr_code && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setQrDialogInstanceId(inst.id)}
                            >
                              <QrCode className="h-3 w-3 mr-1" />
                              Ver QR
                            </Button>
                          )}

                          {/* Spinner se está gerando QR mas ainda não tem */}
                          {isConnecting(inst.status) && !inst.qr_code && (
                            <Button variant="outline" size="sm" disabled>
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              Gerando QR
                            </Button>
                          )}

                          {/* Botão Conectar — apenas para desconectados */}
                          {inst.status === "disconnected" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConnect(inst.id)}
                              disabled={!backendOnline || reconnectInstance.isPending}
                            >
                              <Wifi className="h-3 w-3 mr-1" />
                              Conectar
                            </Button>
                          )}

                          {/* Botão reconectar — apenas para conectados */}
                          {inst.status === "connected" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => reconnectInstance.mutate(inst.id)}
                              disabled={!backendOnline || reconnectInstance.isPending}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteInstance.mutate(inst.id)}
                            disabled={deleteInstance.isPending}
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
