import type { Node, Edge } from "@xyflow/react";

export type FlowNodeType =
  | "trigger"
  | "sendText"
  | "sendImage"
  | "sendAudio"
  | "sendVideo"
  | "sendDocument"
  | "sendButtons"
  | "sendList"
  | "condition"
  | "delay"
  | "assignAgent"
  | "closeChat"
  | "setTag"
  | "httpRequest"
  | "aiResponse";

export interface FlowNodeData {
  type: FlowNodeType;
  label: string;
  // trigger
  triggerType?: "keyword" | "first_message" | "schedule" | "webhook";
  triggerValue?: string;
  // text/media
  text?: string;
  mediaUrl?: string;
  caption?: string;
  // buttons/list
  buttons?: { id: string; text: string }[];
  listSections?: { title: string; rows: { id: string; title: string; description?: string }[] }[];
  // condition
  conditionField?: string;
  conditionOperator?: "equals" | "contains" | "startsWith" | "regex";
  conditionValue?: string;
  // delay
  delayMs?: number;
  // assign
  department?: string;
  // tag
  tagName?: string;
  // http
  httpUrl?: string;
  httpMethod?: "GET" | "POST" | "PUT";
  httpBody?: string;
  httpHeaders?: string;
  // ai
  aiPrompt?: string;
  aiModel?: string;
  aiTemperature?: number;
  aiMaxTokens?: number;
  // group
  groupTitle?: string;
  steps?: FlowNodeData[];
  defaultDelay?: number;
  // internal
  stepId?: string;
  [key: string]: unknown;
}

export type FlowNode = Node<FlowNodeData>;
export type FlowEdge = Edge;

export interface NodeTypeConfig {
  label: string;
  color: string;
  icon: string;
  category: "trigger" | "message" | "logic" | "action" | "ai" | "structure";
  description: string;
}

export const nodeTypeConfig: Record<FlowNodeType, NodeTypeConfig> = {
  trigger:      { label: "Gatilho",         color: "hsl(142 60% 45%)",  icon: "Zap",          category: "trigger",    description: "Inicia o fluxo" },
  sendText:     { label: "Enviar Texto",    color: "hsl(210 80% 55%)",  icon: "MessageSquare",category: "message",    description: "Envia mensagem de texto" },
  sendImage:    { label: "Enviar Imagem",   color: "hsl(280 60% 55%)",  icon: "Image",        category: "message",    description: "Envia uma imagem" },
  sendAudio:    { label: "Enviar Áudio",    color: "hsl(330 60% 55%)",  icon: "Mic",          category: "message",    description: "Envia um áudio" },
  sendVideo:    { label: "Enviar Vídeo",    color: "hsl(200 70% 50%)",  icon: "Video",        category: "message",    description: "Envia um vídeo" },
  sendDocument: { label: "Enviar Documento",color: "hsl(30 70% 50%)",   icon: "FileText",     category: "message",    description: "Envia um arquivo" },
  sendButtons:  { label: "Botões",          color: "hsl(170 60% 45%)",  icon: "LayoutGrid",   category: "message",    description: "Envia botões interativos" },
  sendList:     { label: "Lista",           color: "hsl(190 60% 45%)",  icon: "List",         category: "message",    description: "Envia lista de opções" },
  condition:    { label: "Condição",        color: "hsl(45 80% 50%)",   icon: "GitBranch",    category: "logic",      description: "Bifurca o fluxo" },
  delay:        { label: "Atraso",          color: "hsl(0 0% 55%)",     icon: "Clock",        category: "logic",      description: "Aguarda um tempo" },
  assignAgent:  { label: "Transferir",      color: "hsl(260 50% 55%)",  icon: "UserPlus",     category: "action",     description: "Transfere para atendente" },
  closeChat:    { label: "Fechar Chat",     color: "hsl(0 60% 50%)",    icon: "XCircle",      category: "action",     description: "Encerra a conversa" },
  setTag:       { label: "Adicionar Tag",   color: "hsl(120 40% 50%)",  icon: "Tag",          category: "action",     description: "Marca o contato" },
  httpRequest:  { label: "HTTP Request",    color: "hsl(20 70% 50%)",   icon: "Globe",        category: "action",     description: "Chamada HTTP externa" },
  aiResponse:   { label: "Resposta IA",     color: "hsl(270 70% 60%)",  icon: "Sparkles",     category: "ai",         description: "Gera resposta com IA" },
};

export const categoryLabels: Record<string, string> = {
  trigger: "Gatilhos",
  message: "Mensagens",
  logic: "Lógica",
  action: "Ações",
  ai: "Inteligência Artificial",
};

export function formatDelay(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s}s`;
  const m = s / 60;
  if (m < 60) return `${Math.round(m)}min`;
  return `${Math.round(m / 60)}h`;
}

export const operatorLabels: Record<string, string> = {
  equals: "igual a",
  contains: "contém",
  startsWith: "começa com",
  regex: "regex",
};

export const triggerTypeLabels: Record<string, string> = {
  keyword: "Palavra-chave",
  first_message: "Primeira mensagem",
  schedule: "Agendado",
  webhook: "Webhook",
};

export function getDefaultNodeData(type: FlowNodeType): FlowNodeData {
  const config = nodeTypeConfig[type];
  const base: FlowNodeData = { type, label: config.label };

  switch (type) {
    case "trigger":
      return { ...base, triggerType: "keyword", triggerValue: "" };
    case "sendText":
      return { ...base, text: "" };
    case "sendImage":
    case "sendAudio":
    case "sendVideo":
    case "sendDocument":
      return { ...base, mediaUrl: "", caption: "" };
    case "sendButtons":
      return { ...base, text: "", buttons: [{ id: "1", text: "Opção 1" }] };
    case "sendList":
      return { ...base, text: "", listSections: [{ title: "Seção", rows: [{ id: "1", title: "Item 1" }] }] };
    case "condition":
      return { ...base, conditionField: "message", conditionOperator: "contains", conditionValue: "" };
    case "delay":
      return { ...base, delayMs: 3000 };
    case "assignAgent":
      return { ...base, department: "" };
    case "closeChat":
      return base;
    case "setTag":
      return { ...base, tagName: "" };
    case "httpRequest":
      return { ...base, httpUrl: "", httpMethod: "POST", httpBody: "", httpHeaders: "" };
    case "aiResponse":
      return { ...base, aiPrompt: "", aiModel: "google/gemini-2.5-flash", aiTemperature: 0.7, aiMaxTokens: 1024 };
    default:
      return base;
  }
}
