import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Loader2, CheckCircle2, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface QRCodeDisplayProps {
  status: string;
  qrCode: string | null;
  phone: string | null;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

export function QRCodeDisplay({ status, qrCode, phone, onRegenerate, isRegenerating }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderError, setRenderError] = useState(false);

  useEffect(() => {
    if (!qrCode || !canvasRef.current) return;
    setRenderError(false);

    // qrCode is a raw string from Baileys, render it to canvas
    QRCode.toCanvas(canvasRef.current, qrCode, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#FFFFFF" },
    }).catch((err) => {
      console.error("QR render error:", err);
      setRenderError(true);
    });
  }, [qrCode]);

  // Connected state
  if (status === "connected") {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-lg font-semibold text-foreground">Conectado!</p>
          <p className="text-sm text-muted-foreground">{phone || "WhatsApp vinculado com sucesso"}</p>
        </div>
      </div>
    );
  }

  // QR available
  if (qrCode && !renderError) {
    return (
      <div className="flex flex-col items-center gap-5">
        <div className="relative bg-white p-3 rounded-2xl shadow-lg">
          <canvas ref={canvasRef} className="rounded-lg" />
          <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] px-2">
            PRONTO
          </Badge>
        </div>
        <div className="text-center space-y-1.5">
          <p className="text-sm font-medium text-foreground">Escaneie com o WhatsApp</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Abra o WhatsApp → Menu (⋮) → Aparelhos conectados → Conectar aparelho
          </p>
          <p className="text-[11px] text-muted-foreground/50">Atualiza automaticamente a cada ~20s</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="w-full"
        >
          {isRegenerating
            ? <><Loader2 className="h-3 w-3 animate-spin mr-2" />Atualizando...</>
            : <><RefreshCw className="h-3 w-3 mr-2" />Gerar novo QR</>}
        </Button>
      </div>
    );
  }

  // Error state
  if (renderError) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-foreground">Erro ao renderizar QR</p>
          <p className="text-xs text-muted-foreground">Tente gerar um novo código</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRegenerate} disabled={isRegenerating} className="w-full">
          <RefreshCw className="h-3 w-3 mr-2" />Tentar novamente
        </Button>
      </div>
    );
  }

  // Loading/generating state
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="relative w-[280px] h-[280px] rounded-2xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">Gerando QR Code...</p>
          <p className="text-xs text-muted-foreground text-center px-4">Conectando ao WhatsApp</p>
        </div>
      </div>
    </div>
  );
}
