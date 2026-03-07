import type { FlowNode, FlowNodeData } from "@/types/chatbot";
import { nodeTypeConfig, actionTypeLabels } from "@/types/chatbot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Trash2, Plus, X } from "lucide-react";
import MediaUpload from "./MediaUpload";

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

  if (!config) return null;

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

          {/* sendText */}
          {d.type === "sendText" && (
            <div className="space-y-1">
              <Label className="text-xs">Mensagem</Label>
              <Textarea value={d.textContent || ""} onChange={e => update({ textContent: e.target.value })} rows={4} className="text-xs resize-none" placeholder="Use *negrito*, _itálico_, ~riscado~" />
            </div>
          )}

          {/* sendButtons text */}
          {d.type === "sendButtons" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Mensagem</Label>
                <Textarea value={d.textContent || ""} onChange={e => update({ textContent: e.target.value })} rows={3} className="text-xs resize-none" placeholder="Texto da mensagem" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Botões (máx. 3)</Label>
                {(d.buttons || []).map((btn, i) => (
                  <div key={btn.id} className="flex gap-1">
                    <Input value={btn.text} onChange={e => {
                      const buttons = [...(d.buttons || [])];
                      buttons[i] = { ...btn, text: e.target.value };
                      update({ buttons });
                    }} className="h-7 text-xs" />
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
            </>
          )}

          {/* sendList */}
          {d.type === "sendList" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Mensagem</Label>
                <Textarea value={d.textContent || ""} onChange={e => update({ textContent: e.target.value })} rows={2} className="text-xs resize-none" />
              </div>
              <div className="space-y-3">
                <Label className="text-xs">Seções da Lista</Label>
                {(d.listSections || []).map((sec, si) => (
                  <div key={si} className="space-y-1.5 p-2 rounded-md border border-border/50 bg-muted/30">
                    <div className="flex gap-1">
                      <Input value={sec.title} onChange={e => {
                        const sections = [...(d.listSections || [])];
                        sections[si] = { ...sec, title: e.target.value };
                        update({ listSections: sections });
                      }} className="h-7 text-xs font-semibold" placeholder="Título da seção" />
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => {
                        update({ listSections: (d.listSections || []).filter((_, j) => j !== si) });
                      }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                    {sec.rows.map((row, ri) => (
                      <div key={row.id} className="flex gap-1 pl-2">
                        <div className="flex-1 space-y-0.5">
                          <Input value={row.title} onChange={e => {
                            const sections = [...(d.listSections || [])];
                            const rows = [...sections[si].rows];
                            rows[ri] = { ...row, title: e.target.value };
                            sections[si] = { ...sections[si], rows };
                            update({ listSections: sections });
                          }} className="h-6 text-[11px]" placeholder="Título do item" />
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 self-center" onClick={() => {
                          const sections = [...(d.listSections || [])];
                          sections[si] = { ...sections[si], rows: sections[si].rows.filter((_, j) => j !== ri) };
                          update({ listSections: sections });
                        }}><X className="h-2.5 w-2.5" /></Button>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] w-full" onClick={() => {
                      const sections = [...(d.listSections || [])];
                      sections[si] = { ...sections[si], rows: [...sections[si].rows, { id: String(Date.now()), title: "" }] };
                      update({ listSections: sections });
                    }}><Plus className="h-2.5 w-2.5 mr-1" />Item</Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="h-7 text-xs w-full" onClick={() => {
                  const sections = [...(d.listSections || []), { title: "Nova Seção", rows: [{ id: String(Date.now()), title: "" }] }];
                  update({ listSections: sections });
                }}><Plus className="h-3 w-3 mr-1" />Seção</Button>
              </div>
            </>
          )}

          {/* sendImage */}
          {d.type === "sendImage" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Imagem</Label>
                <MediaUpload value={d.mediaUrl || ""} onChange={(url) => update({ mediaUrl: url })} accept="image/jpeg,image/png,image/webp,image/gif" type="image" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Legenda</Label>
                <Input value={d.caption || ""} onChange={e => update({ caption: e.target.value })} className="h-8 text-xs" />
              </div>
            </>
          )}

          {/* sendAudio */}
          {d.type === "sendAudio" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Áudio</Label>
                <MediaUpload value={d.audioUrl || ""} onChange={(url) => update({ audioUrl: url })} accept="audio/mpeg,audio/ogg,audio/wav,audio/mp4,audio/x-m4a" type="audio" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Simular gravação</Label>
                <Switch checked={d.simulateRecording || false} onCheckedChange={(v) => update({ simulateRecording: v })} />
              </div>
            </>
          )}

          {/* sendVideo */}
          {d.type === "sendVideo" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Vídeo</Label>
                <MediaUpload value={d.mediaUrl || ""} onChange={(url) => update({ mediaUrl: url })} accept="video/mp4,video/quicktime,video/x-msvideo" type="video" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Legenda</Label>
                <Input value={d.caption || ""} onChange={e => update({ caption: e.target.value })} className="h-8 text-xs" />
              </div>
            </>
          )}

          {/* sendFile */}
          {d.type === "sendFile" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Arquivo</Label>
                <MediaUpload value={d.fileUrl || ""} onChange={(url) => update({ fileUrl: url })} accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" type="document" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nome do arquivo</Label>
                <Input value={d.fileName || ""} onChange={e => update({ fileName: e.target.value })} className="h-8 text-xs" placeholder="documento.pdf" />
              </div>
            </>
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
                    <SelectItem value="phone">Telefone</SelectItem>
                    <SelectItem value="tag">Tag</SelectItem>
                    <SelectItem value="custom_field">Campo personalizado</SelectItem>
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
                    <SelectItem value="has_tag">Tem tag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Valor</Label>
                <Input value={d.conditionValue || ""} onChange={e => update({ conditionValue: e.target.value })} className="h-8 text-xs" />
              </div>
            </>
          )}

          {/* waitDelay */}
          {d.type === "waitDelay" && (
            <>
              <div className="space-y-3">
                <Label className="text-xs">Tempo de espera (segundos)</Label>
                <Slider value={[d.delaySeconds || 3]} onValueChange={([v]) => update({ delaySeconds: v })} min={1} max={300} step={1} />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>1s</span>
                  <span className="font-semibold text-foreground text-xs">
                    {(() => {
                      const s = d.delaySeconds || 3;
                      if (s < 60) return `${s} segundo${s !== 1 ? "s" : ""}`;
                      const m = Math.floor(s / 60);
                      const rs = s % 60;
                      return `${m}min${rs > 0 ? ` ${rs}s` : ""}`;
                    })()}
                  </span>
                  <span>5min</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Simular digitação</Label>
                <Switch checked={d.simulateTyping ?? true} onCheckedChange={(v) => update({ simulateTyping: v })} />
              </div>
              {d.simulateTyping && (
                <div className="space-y-1">
                  <Label className="text-xs">Tipo de presença</Label>
                  <Select value={d.delayPresenceType || "typing"} onValueChange={v => update({ delayPresenceType: v as "typing" | "recording" })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="typing">Digitando</SelectItem>
                      <SelectItem value="recording">Gravando áudio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label className="text-xs">Delay aleatório</Label>
                <Switch checked={d.delayRandomMode || false} onCheckedChange={(v) => update({ delayRandomMode: v })} />
              </div>
              {d.delayRandomMode && (
                <div className="flex gap-2">
                  <div className="space-y-1 flex-1">
                    <Label className="text-xs">Mín (s)</Label>
                    <Input type="number" value={d.delayMinSeconds ?? 1} onChange={e => update({ delayMinSeconds: Number(e.target.value) })} className="h-8 text-xs" min={1} />
                  </div>
                  <div className="space-y-1 flex-1">
                    <Label className="text-xs">Máx (s)</Label>
                    <Input type="number" value={d.delayMaxSeconds ?? 10} onChange={e => update({ delayMaxSeconds: Number(e.target.value) })} className="h-8 text-xs" min={1} />
                  </div>
                </div>
              )}
            </>
          )}

          {/* waitForReply */}
          {d.type === "waitForReply" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Variável de resposta</Label>
                <Input value={d.replyVariable || "reply"} onChange={e => update({ replyVariable: e.target.value })} className="h-8 text-xs" placeholder="reply" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Timeout</Label>
                <div className="flex gap-2">
                  <Input type="number" min={1} value={d.replyTimeout ?? 5} onChange={e => update({ replyTimeout: Math.max(1, Number(e.target.value)) })} className="h-8 text-xs w-20" />
                  <Select value={d.replyTimeoutUnit || "minutes"} onValueChange={v => update({ replyTimeoutUnit: v as FlowNodeData["replyTimeoutUnit"] })}>
                    <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seconds">Segundos</SelectItem>
                      <SelectItem value="minutes">Minutos</SelectItem>
                      <SelectItem value="hours">Horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mensagem de fallback</Label>
                <Input value={d.replyFallback || ""} onChange={e => update({ replyFallback: e.target.value })} className="h-8 text-xs" placeholder="Não entendi, tente novamente..." />
              </div>
            </>
          )}

          {/* waitForClick */}
          {d.type === "waitForClick" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">URL do link</Label>
                <Input value={d.clickUrl || ""} onChange={e => update({ clickUrl: e.target.value })} className="h-8 text-xs" placeholder="https://..." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mensagem com link</Label>
                <Textarea value={d.clickMessage || ""} onChange={e => update({ clickMessage: e.target.value })} rows={2} className="text-xs resize-none" placeholder="Clique no link abaixo..." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Timeout</Label>
                <div className="flex gap-2">
                  <Input type="number" min={1} value={d.clickTimeout ?? 5} onChange={e => update({ clickTimeout: Math.max(1, Number(e.target.value)) })} className="h-8 text-xs w-20" />
                  <Select value={d.clickTimeoutUnit || "minutes"} onValueChange={v => update({ clickTimeoutUnit: v as FlowNodeData["clickTimeoutUnit"] })}>
                    <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seconds">Segundos</SelectItem>
                      <SelectItem value="minutes">Minutos</SelectItem>
                      <SelectItem value="hours">Horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {/* Action */}
          {d.type === "action" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Tipo de ação</Label>
                <Select value={d.actionType || "assignAgent"} onValueChange={v => update({ actionType: v as FlowNodeData["actionType"] })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(actionTypeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {d.actionType === "assignAgent" && (
                <div className="space-y-1">
                  <Label className="text-xs">Departamento</Label>
                  <Input value={d.department || ""} onChange={e => update({ department: e.target.value, actionValue: e.target.value })} className="h-8 text-xs" placeholder="Suporte, Vendas..." />
                </div>
              )}
              {(d.actionType === "setTag" || d.actionType === "removeTag") && (
                <div className="space-y-1">
                  <Label className="text-xs">Nome da tag</Label>
                  <Input value={d.tagName || ""} onChange={e => update({ tagName: e.target.value, actionValue: e.target.value })} className="h-8 text-xs" />
                </div>
              )}
              {d.actionType === "httpRequest" && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">URL</Label>
                    <Input value={d.httpUrl || ""} onChange={e => update({ httpUrl: e.target.value })} className="h-8 text-xs" placeholder="https://api.example.com" />
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
                    <Label className="text-xs">Headers (JSON)</Label>
                    <Textarea value={d.httpHeaders || ""} onChange={e => update({ httpHeaders: e.target.value })} rows={2} className="text-xs font-mono resize-none" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Body (JSON)</Label>
                    <Textarea value={d.httpBody || ""} onChange={e => update({ httpBody: e.target.value })} rows={3} className="text-xs font-mono resize-none" />
                  </div>
                </>
              )}
            </>
          )}

          {/* Randomizer */}
          {d.type === "randomizer" && (
            <div className="space-y-3">
              <Label className="text-xs">Número de caminhos</Label>
              <Slider value={[d.paths || 2]} onValueChange={([v]) => update({ paths: v })} min={2} max={6} step={1} />
              <p className="text-center text-sm font-semibold text-foreground">{d.paths || 2} caminhos</p>
            </div>
          )}

          {/* AI Agent */}
          {d.type === "aiAgent" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Prompt do sistema</Label>
                <Textarea value={d.aiSystemPrompt || ""} onChange={e => update({ aiSystemPrompt: e.target.value })} rows={4} className="text-xs resize-none" placeholder="Você é um assistente..." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Modelo</Label>
                <Select value={d.aiModel || "google/gemini-2.5-flash"} onValueChange={v => update({ aiModel: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                    <SelectItem value="google/gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</SelectItem>
                    <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                    <SelectItem value="openai/gpt-5-nano">GPT-5 Nano</SelectItem>
                    <SelectItem value="openai/gpt-5-mini">GPT-5 Mini</SelectItem>
                    <SelectItem value="openai/gpt-5">GPT-5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Temperatura: {(d.aiTemperature ?? 0.7).toFixed(1)}</Label>
                <Slider value={[d.aiTemperature ?? 0.7]} onValueChange={([v]) => update({ aiTemperature: parseFloat(v.toFixed(1)) })} min={0} max={2} step={0.1} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max Tokens</Label>
                <Input type="number" value={d.aiMaxTokens ?? 1024} onChange={e => update({ aiMaxTokens: Number(e.target.value) })} className="h-8 text-xs" min={64} max={8192} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Histórico (mensagens)</Label>
                <Input type="number" value={d.aiHistoryCount ?? 10} onChange={e => update({ aiHistoryCount: Number(e.target.value) })} className="h-8 text-xs" min={0} max={50} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Enviar automaticamente</Label>
                <Switch checked={d.aiAutoSend ?? true} onCheckedChange={(v) => update({ aiAutoSend: v })} />
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
