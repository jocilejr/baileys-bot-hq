import type { FlowNode, FlowNodeData } from "@/types/chatbot";
import { nodeTypeConfig } from "@/types/chatbot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

          {/* Media Upload */}
          {d.type === "sendImage" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Imagem</Label>
                <MediaUpload
                  value={d.mediaUrl || ""}
                  onChange={(url) => update({ mediaUrl: url })}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  type="image"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Legenda</Label>
                <Input value={d.caption || ""} onChange={e => update({ caption: e.target.value })} className="h-8 text-xs" />
              </div>
            </>
          )}
          {d.type === "sendAudio" && (
            <div className="space-y-1">
              <Label className="text-xs">Áudio</Label>
              <MediaUpload
                value={d.mediaUrl || ""}
                onChange={(url) => update({ mediaUrl: url })}
                accept="audio/mpeg,audio/ogg,audio/wav,audio/mp4,audio/x-m4a"
                type="audio"
              />
            </div>
          )}
          {d.type === "sendVideo" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Vídeo</Label>
                <MediaUpload
                  value={d.mediaUrl || ""}
                  onChange={(url) => update({ mediaUrl: url })}
                  accept="video/mp4,video/quicktime,video/x-msvideo"
                  type="video"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Legenda</Label>
                <Input value={d.caption || ""} onChange={e => update({ caption: e.target.value })} className="h-8 text-xs" />
              </div>
            </>
          )}
          {d.type === "sendDocument" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Documento</Label>
                <MediaUpload
                  value={d.mediaUrl || ""}
                  onChange={(url) => update({ mediaUrl: url })}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                  type="document"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Legenda</Label>
                <Input value={d.caption || ""} onChange={e => update({ caption: e.target.value })} className="h-8 text-xs" />
              </div>
            </>
          )}

          {/* Buttons */}
          {d.type === "sendButtons" && (
            <div className="space-y-2">
              <Label className="text-xs">Botões (máx. 3)</Label>
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

          {/* List Sections */}
          {d.type === "sendList" && (
            <div className="space-y-3">
              <Label className="text-xs">Seções da Lista</Label>
              {(d.listSections || []).map((sec, si) => (
                <div key={si} className="space-y-1.5 p-2 rounded-md border border-border/50 bg-muted/30">
                  <div className="flex gap-1">
                    <Input
                      value={sec.title}
                      onChange={e => {
                        const sections = [...(d.listSections || [])];
                        sections[si] = { ...sec, title: e.target.value };
                        update({ listSections: sections });
                      }}
                      className="h-7 text-xs font-semibold"
                      placeholder="Título da seção"
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => {
                      update({ listSections: (d.listSections || []).filter((_, j) => j !== si) });
                    }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                  {sec.rows.map((row, ri) => (
                    <div key={row.id} className="flex gap-1 pl-2">
                      <div className="flex-1 space-y-0.5">
                        <Input
                          value={row.title}
                          onChange={e => {
                            const sections = [...(d.listSections || [])];
                            const rows = [...sections[si].rows];
                            rows[ri] = { ...row, title: e.target.value };
                            sections[si] = { ...sections[si], rows };
                            update({ listSections: sections });
                          }}
                          className="h-6 text-[11px]"
                          placeholder="Título do item"
                        />
                        <Input
                          value={row.description || ""}
                          onChange={e => {
                            const sections = [...(d.listSections || [])];
                            const rows = [...sections[si].rows];
                            rows[ri] = { ...row, description: e.target.value };
                            sections[si] = { ...sections[si], rows };
                            update({ listSections: sections });
                          }}
                          className="h-6 text-[10px] text-muted-foreground"
                          placeholder="Descrição (opcional)"
                        />
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
                    <SelectItem value="email">E-mail</SelectItem>
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
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Valor</Label>
                <Input value={d.conditionValue || ""} onChange={e => update({ conditionValue: e.target.value })} className="h-8 text-xs" />
              </div>
            </>
          )}

          {/* Delay - Slider */}
          {d.type === "delay" && (
            <div className="space-y-3">
              <Label className="text-xs">Tempo de espera</Label>
              <div className="space-y-2">
                <Slider
                  value={[(d.delayMs || 3000) / 1000]}
                  onValueChange={([v]) => update({ delayMs: v * 1000 })}
                  min={1}
                  max={300}
                  step={1}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>1s</span>
                  <span className="font-semibold text-foreground text-xs">
                    {(() => {
                      const s = (d.delayMs || 3000) / 1000;
                      if (s < 60) return `${s} segundo${s !== 1 ? "s" : ""}`;
                      const m = Math.floor(s / 60);
                      const rs = s % 60;
                      return `${m}min${rs > 0 ? ` ${rs}s` : ""}`;
                    })()}
                  </span>
                  <span>5min</span>
                </div>
              </div>
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
                <Input value={d.httpUrl || ""} onChange={e => update({ httpUrl: e.target.value })} className="h-8 text-xs" placeholder="https://api.example.com/endpoint" />
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
                <Textarea value={d.httpHeaders || ""} onChange={e => update({ httpHeaders: e.target.value })} rows={2} className="text-xs font-mono resize-none" placeholder='{"Authorization": "Bearer ..."}' />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Body (JSON)</Label>
                <Textarea value={d.httpBody || ""} onChange={e => update({ httpBody: e.target.value })} rows={3} className="text-xs font-mono resize-none" placeholder='{"key": "value"}' />
              </div>
            </>
          )}

          {/* AI */}
          {d.type === "aiResponse" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Prompt do sistema</Label>
                <Textarea value={d.aiPrompt || ""} onChange={e => update({ aiPrompt: e.target.value })} rows={4} className="text-xs resize-none" placeholder="Você é um assistente..." />
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
                <Slider
                  value={[d.aiTemperature ?? 0.7]}
                  onValueChange={([v]) => update({ aiTemperature: parseFloat(v.toFixed(1)) })}
                  min={0}
                  max={2}
                  step={0.1}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Preciso</span>
                  <span>Criativo</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max Tokens</Label>
                <Input type="number" value={d.aiMaxTokens ?? 1024} onChange={e => update({ aiMaxTokens: Number(e.target.value) })} className="h-8 text-xs" min={64} max={8192} />
              </div>
            </>
          )}

          {/* Group */}
          {d.type === "group" && (
            <div className="space-y-1">
              <Label className="text-xs">Título do grupo</Label>
              <Input value={d.groupTitle || ""} onChange={e => update({ groupTitle: e.target.value })} className="h-8 text-xs" />
            </div>
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
