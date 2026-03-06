import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Upload, Download, User, Tag } from "lucide-react";

const contatos = [
  { id: 1, name: "João Silva", phone: "+55 11 99999-0001", tags: ["Cliente", "VIP"], lastContact: "Hoje" },
  { id: 2, name: "Maria Santos", phone: "+55 11 99999-0002", tags: ["Lead"], lastContact: "Ontem" },
  { id: 3, name: "Carlos Oliveira", phone: "+55 11 99999-0003", tags: ["Cliente"], lastContact: "3 dias" },
  { id: 4, name: "Ana Costa", phone: "+55 11 99999-0004", tags: ["Lead", "Interessado"], lastContact: "1 semana" },
  { id: 5, name: "Pedro Lima", phone: "+55 11 99999-0005", tags: ["Suporte"], lastContact: "Hoje" },
];

const Contatos = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contatos</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus contatos e leads</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-1" />Importar</Button>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />Exportar</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo Contato</Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar contatos..." className="pl-9 bg-secondary/50 border-0" />
      </div>

      <Card className="bg-card border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Contato</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Último Contato</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contatos.map((c) => (
              <TableRow key={c.id} className="border-border cursor-pointer hover:bg-secondary/30">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{c.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {c.tags.map((t) => (
                      <Badge key={t} variant="outline" className="text-[10px] border-primary/30 text-primary">{t}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{c.lastContact}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Contatos;
