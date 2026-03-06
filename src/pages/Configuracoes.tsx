import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Clock, MessageSquare, Globe } from "lucide-react";
import { useSettings, useUpdateSetting } from "@/hooks/useSettings";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const Configuracoes = () => {
  const { data: settings, isLoading } = useSettings();
  const updateSetting = useUpdateSetting();
  const { toast } = useToast();

  const [apiUrl, setApiUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [welcomeMsg, setWelcomeMsg] = useState("");
  const [awayMsg, setAwayMsg] = useState("");
  const [hoursStart, setHoursStart] = useState("08:00");
  const [hoursEnd, setHoursEnd] = useState("18:00");

  useEffect(() => {
    if (settings) {
      setApiUrl(String(settings.api_url || "").replace(/"/g, ""));
      setApiToken(String(settings.api_token || "").replace(/"/g, ""));
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

  if (isLoading) return <div className="p-6"><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">Configure seu sistema ZapManager</p>
      </div>

      <Tabs defaultValue="geral" className="space-y-4">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="horario">Horário</TabsTrigger>
          <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="geral">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4 text-primary" />Configurações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>URL da API Backend (Baileys)</Label>
                <Input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="https://sua-vps.com:3001" className="bg-secondary/50 border-0" />
                <p className="text-xs text-muted-foreground">Endereço onde o backend Node.js + Baileys está rodando</p>
              </div>
              <div className="space-y-2">
                <Label>Token de Autenticação da API</Label>
                <Input type="password" value={apiToken} onChange={(e) => setApiToken(e.target.value)} placeholder="Bearer token..." className="bg-secondary/50 border-0" />
              </div>
              <Button size="sm" onClick={() => { save("api_url", apiUrl); save("api_token", apiToken); }}>Salvar</Button>
            </CardContent>
          </Card>
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
