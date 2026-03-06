import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Smartphone, QrCode, RefreshCw, Trash2, Wifi, WifiOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useInstances, useCreateInstance, useDeleteInstance, useBaileysProxy } from "@/hooks/useInstances";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const Instancias = () => {
  const { data: instances, isLoading } = useInstances();
  const createInstance = useCreateInstance();
  const deleteInstance = useDeleteInstance();
  const baileysProxy = useBaileysProxy();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const handleCreate = async () => {
    if (!name) return;
    try {
      await createInstance.mutateAsync({ name });
      toast({ title: "Instância criada com sucesso" });
      setOpen(false);
      setName("");
    } catch (e: any) {
      toast({ title: "Erro ao criar instância", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInstance.mutateAsync(id);
      toast({ title: "Instância removida" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleReconnect = async (id: string) => {
    try {
      await baileysProxy.mutateAsync({ action: "reconnect", instanceId: id });
      toast({ title: "Reconectando..." });
    } catch (e: any) {
      toast({ title: "Erro ao reconectar", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Instâncias WhatsApp</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas conexões WhatsApp via Baileys</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova Instância</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Instância</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Vendas Principal" />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+55 11 99999-0001" />
              </div>
              <Button onClick={handleCreate} disabled={createInstance.isPending} className="w-full">
                {createInstance.isPending ? "Criando..." : "Criar Instância"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : instances?.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Smartphone className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma instância cadastrada</p>
            <p className="text-xs text-muted-foreground mt-1">Clique em "Nova Instância" para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {instances?.map((inst) => (
            <Card key={inst.id} className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-primary" />
                    {inst.name}
                  </CardTitle>
                  <Badge variant={inst.status === "connected" ? "default" : "destructive"} className="text-[10px]">
                    {inst.status === "connected" ? <><Wifi className="h-3 w-3 mr-1" />Conectado</> : <><WifiOff className="h-3 w-3 mr-1" />{inst.status}</>}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>{inst.phone || "Sem número"}</p>
                </div>

                {inst.status !== "connected" && inst.qr_code && (
                  <div className="flex items-center justify-center p-4 rounded-lg bg-secondary/50 border border-border border-dashed">
                    <div className="text-center">
                      <img src={inst.qr_code} alt="QR Code" className="h-32 w-32 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Escaneie o QR Code para conectar</p>
                    </div>
                  </div>
                )}

                {inst.status !== "connected" && !inst.qr_code && (
                  <div className="flex items-center justify-center p-6 rounded-lg bg-secondary/50 border border-border border-dashed">
                    <div className="text-center">
                      <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Clique em Reconectar para gerar o QR Code</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleReconnect(inst.id)}>
                    <RefreshCw className="h-3 w-3 mr-1" />Reconectar
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(inst.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Instancias;
