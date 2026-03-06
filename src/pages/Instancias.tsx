import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Smartphone, QrCode, RefreshCw, Trash2, Wifi, WifiOff } from "lucide-react";

const instancias = [
  { id: 1, name: "Vendas Principal", number: "+55 11 99999-0001", status: "connected", uptime: "5 dias" },
  { id: 2, name: "Suporte", number: "+55 11 99999-0002", status: "connected", uptime: "12 dias" },
  { id: 3, name: "Marketing", number: "+55 11 99999-0003", status: "disconnected", uptime: "-" },
];

const Instancias = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Instâncias WhatsApp</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas conexões WhatsApp via Baileys</p>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova Instância</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {instancias.map((inst) => (
          <Card key={inst.id} className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-primary" />
                  {inst.name}
                </CardTitle>
                <Badge variant={inst.status === "connected" ? "default" : "destructive"} className="text-[10px]">
                  {inst.status === "connected" ? <><Wifi className="h-3 w-3 mr-1" />Conectado</> : <><WifiOff className="h-3 w-3 mr-1" />Desconectado</>}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>{inst.number}</p>
                {inst.uptime !== "-" && <p className="text-xs mt-1">Online há {inst.uptime}</p>}
              </div>

              {inst.status === "disconnected" && (
                <div className="flex items-center justify-center p-6 rounded-lg bg-secondary/50 border border-border border-dashed">
                  <div className="text-center">
                    <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Escaneie o QR Code para conectar</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <RefreshCw className="h-3 w-3 mr-1" />Reconectar
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Instancias;
