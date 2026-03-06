import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Clock, MessageSquare, Globe, Shield } from "lucide-react";

const Configuracoes = () => {
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
                <Input placeholder="https://sua-vps.com:3001" className="bg-secondary/50 border-0" />
                <p className="text-xs text-muted-foreground">Endereço onde o backend Node.js + Baileys está rodando</p>
              </div>
              <div className="space-y-2">
                <Label>Token de Autenticação da API</Label>
                <Input type="password" placeholder="Bearer token..." className="bg-secondary/50 border-0" />
              </div>
              <Button size="sm">Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="horario">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />Horário de Atendimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Ativar horário de atendimento</Label>
                <Switch />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Início</Label>
                  <Input type="time" defaultValue="08:00" className="bg-secondary/50 border-0" />
                </div>
                <div className="space-y-2">
                  <Label>Fim</Label>
                  <Input type="time" defaultValue="18:00" className="bg-secondary/50 border-0" />
                </div>
              </div>
              <Button size="sm">Salvar</Button>
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
                <Textarea placeholder="Olá! Seja bem-vindo..." className="bg-secondary/50 border-0 min-h-[80px]" />
              </div>
              <div className="space-y-2">
                <Label>Mensagem Fora do Horário</Label>
                <Textarea placeholder="Nosso horário de atendimento é..." className="bg-secondary/50 border-0 min-h-[80px]" />
              </div>
              <Button size="sm">Salvar</Button>
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
