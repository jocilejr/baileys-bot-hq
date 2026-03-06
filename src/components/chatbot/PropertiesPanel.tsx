import type { FlowNode, FlowNodeData } from "@/types/chatbot";
import { nodeTypeConfig } from "@/types/chatbot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Plus, X } from "lucide-react";

interface Props {
  node: FlowNode;
  onChange: (id: string, data: Partial<FlowNodeData>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function PropertiesPanel({ node, onChange, onDelete, onClose }: Props) {
  const d = node.data as unknown as FlowNodeData;
  const config = nodeTypeConfig[d.type];
  const update = (partial: Partial<FlowNodeData>) => onChange(node.id, partial);

  return (
    <div className="w-72 border-l bg-card flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
          <span className="text-sm font-semibold text-foreground">{config.label}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Label */}
          <div className="space-y-1">
            <Label className="text-xs">Nome do bloco</Label>
            <Input value={d.label || ""} onChange={e => update({ label: e.target.value })} className="h-8 text-xs" />
          </div>

          {/* Trigger */}
          {d.type === "trigger" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Tipo de gatilho</Label>
                <Select value={d.triggerType || "keyword"} onValueChange={v => update({ triggerType: v as FlowNodeData["triggerType"] })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keyword">Palavra-chave</SelectItem>
                    <SelectItem value="first_message">Primeira mensagem</SelectItem>
                    <SelectItem value="schedule">Agendado</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {d.triggerType !== "first_message" && (
                <div className="space-y-1">
                  <Label className="text-xs">Valor</Label>
                  <Input value={d.triggerValue || ""} onChange={e => update({ triggerValue: e.target.value })} className="h-8 text-xs" placeholder="ex: oi, menu, #promo" />
                </div>
              )}
            </>
          )}

          {/* Text */}
          {(d.type === "sendText" || d.type === "sendButtons" || d.type === "sendList") && (
            <div className="space-y-1">
              <Label className="text-xs">Mensagem</Label>
              <Textarea value={d.text || ""} onChange={e => update({ text: e.target.value })} rows={4} className="text-xs resize-none" placeholder="Use *negrito*, _itálico_, ~riscado~" />
            </div>
          )}

          {/* Media URL */}
          {["sendImage", "sendAudio", "sendVideo", "sendDocument"].includes(d.type) && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">URL da mídia</Label>
                <Input value={d.mediaUrl || ""} onChange={e => update({ mediaUrl: e.target.value })} className="h-8 text-xs" placeholder="https://..." />
              </div>
              {d.type !== "sendAudio" && (
                <div className="space-y-1">
                  <Label className="text-xs">Legenda</Label>
                  <Input value={d.caption || ""} onChange={e => update({ caption: e.target.value })} className="h-8 text-xs" />
                </div>
              )}
            </>
          )}

          {/* Buttons */}
          {d.type === "sendButtons" && (
            <div className="space-y-2">
              <Label className="text-xs">Botões</Label>
              {(d.buttons || []).map((btn, i) => (
                <div key={btn.id} className="flex gap-1">
                  <Input
                    value={btn.text}
                    onChange={e => {
                      const buttons = [...(d.buttons || [])];
                      buttons[i] = { ...btn, text: e.target.value };
                      update({ buttons });
                    }}
                    className="h-7 text-xs"
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => {
                    update({ buttons: (d.buttons || []).filter((_, j) => j !== i) });
                  }}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
              {(d.buttons || []).length < 3 && (
                <Button variant="outline" size="sm" className="h-7 text-xs w-full" onClick={() => {
                  const buttons = [...(d.buttons || []), { id: String(Date.now()), text: `Opção ${(d.buttons || []).length + 1}` }];
                  update({ buttons });
                }}><Plus className="h-3 w-3 mr-1" />Botão</Button>
              )}
            </div>
          )}

          {/* Condition */}
          {d.type === "condition" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Campo</Label>
                <Select value={d.conditionField || "message"} onValueChange={v => update({ conditionField: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="message">Mensagem</SelectItem>
                    <SelectItem value="contact_name">Nome do contato</SelectItem>
                    <SelectItem value="tag">Tag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Operador</Label>
                <Select value={d.conditionOperator || "contains"} onValueChange={v => update({ conditionOperator: v as FlowNodeData["conditionOperator"] })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Igual a</SelectItem>
                    <SelectItem value="contains">Contém</SelectItem>
                    <SelectItem value="startsWith">Começa com</SelectItem>
                    <SelectItem value="regex">Regex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Valor</Label>
                <Input value={d.conditionValue || ""} onChange={e => update({ conditionValue: e.target.value })} className="h-8 text-xs" />
              </div>
            </>
          )}

          {/* Delay */}
          {d.type === "delay" && (
            <div className="space-y-1">
              <Label className="text-xs">Tempo (ms)</Label>
              <Input type="number" value={d.delayMs || 3000} onChange={e => update({ delayMs: Number(e.target.value) })} className="h-8 text-xs" />
            </div>
          )}

          {/* Assign */}
          {d.type === "assignAgent" && (
            <div className="space-y-1">
              <Label className="text-xs">Departamento</Label>
              <Input value={d.department || ""} onChange={e => update({ department: e.target.value })} className="h-8 text-xs" placeholder="Suporte, Vendas..." />
            </div>
          )}

          {/* Tag */}
          {d.type === "setTag" && (
            <div className="space-y-1">
              <Label className="text-xs">Nome da tag</Label>
              <Input value={d.tagName || ""} onChange={e => update({ tagName: e.target.value })} className="h-8 text-xs" />
            </div>
          )}

          {/* HTTP */}
          {d.type === "httpRequest" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">URL</Label>
                <Input value={d.httpUrl || ""} onChange={e => update({ httpUrl: e.target.value })} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Método</Label>
                <Select value={d.httpMethod || "POST"} onValueChange={v => update({ httpMethod: v as FlowNodeData["httpMethod"] })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Body (JSON)</Label>
                <Textarea value={d.httpBody || ""} onChange={e => update({ httpBody: e.target.value })} rows={3} className="text-xs font-mono resize-none" />
              </div>
            </>
          )}

          {/* AI */}
          {d.type === "aiResponse" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Prompt</Label>
                <Textarea value={d.aiPrompt || ""} onChange={e => update({ aiPrompt: e.target.value })} rows={4} className="text-xs resize-none" placeholder="Você é um assistente..." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Modelo</Label>
                <Select value={d.aiModel || "google/gemini-2.5-flash"} onValueChange={v => update({ aiModel: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                    <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                    <SelectItem value="openai/gpt-5-mini">GPT-5 Mini</SelectItem>
                    <SelectItem value="openai/gpt-5">GPT-5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t">
        <Button variant="destructive" size="sm" className="w-full h-8 text-xs" onClick={() => onDelete(node.id)}>
          <Trash2 className="h-3 w-3 mr-1" />Excluir bloco
        </Button>
      </div>
    </div>
  );
}
