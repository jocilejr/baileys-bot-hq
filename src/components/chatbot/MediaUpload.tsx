import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, FileText, Image, Mic, Video } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (url: string) => void;
  accept: string;
  type: "image" | "audio" | "video" | "document";
}

const typeConfig = {
  image: { icon: Image, label: "Enviar imagem", extensions: "JPG, PNG, WEBP, GIF" },
  audio: { icon: Mic, label: "Enviar áudio", extensions: "MP3, OGG, WAV, M4A" },
  video: { icon: Video, label: "Enviar vídeo", extensions: "MP4, MOV, AVI" },
  document: { icon: FileText, label: "Enviar documento", extensions: "PDF, DOC, XLS, CSV" },
};

export default function MediaUpload({ value, onChange, accept, type }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const config = typeConfig[type];
  const Icon = config.icon;

  const handleUpload = async (file: File) => {
    if (!file) return;

    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      toast.error("Arquivo muito grande (máx. 20MB)");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${type}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error } = await supabase.storage
        .from("automation-media")
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("automation-media")
        .getPublicUrl(path);

      onChange(urlData.publicUrl);
      toast.success("Arquivo enviado!");
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!value) return;
    try {
      // Extract path from URL
      const url = new URL(value);
      const pathMatch = url.pathname.match(/automation-media\/(.+)$/);
      if (pathMatch) {
        await supabase.storage.from("automation-media").remove([pathMatch[1]]);
      }
    } catch {
      // ignore deletion errors
    }
    onChange("");
  };

  if (value) {
    return (
      <div className="space-y-2">
        {type === "image" && (
          <div className="relative w-full h-24 rounded-md bg-muted overflow-hidden border border-border/50">
            <img src={value} alt="" className="w-full h-full object-cover" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6"
              onClick={handleRemove}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        {type === "audio" && (
          <div className="space-y-1.5">
            <audio controls src={value} className="w-full h-8" style={{ maxHeight: 32 }} />
            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-destructive w-full" onClick={handleRemove}>
              <X className="h-3 w-3 mr-1" />Remover áudio
            </Button>
          </div>
        )}
        {type === "video" && (
          <div className="space-y-1.5">
            <video controls src={value} className="w-full h-20 rounded-md bg-muted" />
            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-destructive w-full" onClick={handleRemove}>
              <X className="h-3 w-3 mr-1" />Remover vídeo
            </Button>
          </div>
        )}
        {type === "document" && (
          <div className="flex items-center gap-2 p-2 rounded-md border border-border/50 bg-muted/30">
            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
            <p className="text-[10px] text-muted-foreground truncate flex-1">
              {decodeURIComponent(value.split("/").pop() || "arquivo")}
            </p>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-destructive" onClick={handleRemove}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          "w-full flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed transition-colors",
          "border-border/50 hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
          uploading && "opacity-60 pointer-events-none"
        )}
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <div className="p-2 rounded-full bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs font-medium text-foreground">{config.label}</span>
            <span className="text-[10px] text-muted-foreground">{config.extensions} • Máx. 20MB</span>
          </div>
        )}
      </button>
    </div>
  );
}
