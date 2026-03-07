import type { Node, Edge } from "@xyflow/react";

export type FlowNodeType =
  | "trigger"
  | "sendText"
  | "sendImage"
  | "sendAudio"
  | "sendVideo"
  | "sendFile"
  | "sendButtons"
  | "sendList"
  | "condition"
  | "waitDelay"
  | "waitForReply"
  | "waitForClick"
  | "action"
  | "randomizer"
  | "aiAgent";

export interface FlowNodeData {
  type: FlowNodeType;
  label: string;
  // trigger
  triggerType?: "keyword" | "first_message" | "schedule" | "webhook";
  triggerValue?: string;
  // text
  textContent?: string;
  // media (image, video)
  mediaUrl?: string;
  caption?: string;
  // audio
  audioUrl?: string;
  simulateRecording?: boolean;
  // file (document)
  fileUrl?: string;
  fileName?: string;
  // buttons / list
  buttons?: { id: string; text: string }[];
  listSections?: { title: string; rows: { id: string; title: string; description?: string }[] }[];
  // condition
  conditionField?: string;
  conditionOperator?: "equals" | "contains" | "startsWith" | "regex" | "has_tag";
  conditionValue?: string;
  // waitDelay
  delaySeconds?: number;
  delayRandomMode?: boolean;
  delayMinSeconds?: number;
  delayMaxSeconds?: number;
  simulateTyping?: boolean;
  delayPresenceType?: "typing" | "recording";
  // waitForReply
  replyVariable?: string;
  replyTimeout?: number;
  replyTimeoutUnit?: "seconds" | "minutes" | "hours";
  replyFallback?: string;
  // waitForClick
  clickUrl?: string;
  clickTimeout?: number;
  clickTimeoutUnit?: "seconds" | "minutes" | "hours";
  clickMessage?: string;
  // action
  actionType?: "assignAgent" | "closeChat" | "setTag" | "httpRequest" | "removeTag";
  actionValue?: string;
  httpUrl?: string;
  httpMethod?: "GET" | "POST" | "PUT";
  httpBody?: string;
  httpHeaders?: string;
  department?: string;
  tagName?: string;
  // randomizer
  paths?: number;
  // aiAgent
  aiSystemPrompt?: string;
  aiModel?: string;
  aiTemperature?: number;
  aiMaxTokens?: number;
  aiAcceptedMedia?: string[];
  aiResponseVariable?: string;
  aiAutoSend?: boolean;
  aiHistoryCount?: number;
  // group
  groupTitle?: string;
  steps?: FlowStepData[];
  defaultDelay?: number;
  // visual state
  isDockTarget?: boolean;
  // internal
  stepId?: string;
  [key: string]: unknown;
}

export interface FlowStepData {
  id: string;
  data: FlowNodeData;
}

export type FlowNode = Node<FlowNodeData>;
export type FlowEdge = Edge;

export interface NodeTypeConfig {
  label: string;
  color: string;
  icon: string;
  category: "trigger" | "message" | "logic" | "action" | "ai";
  description: string;
}

export const nodeTypeConfig: Record<FlowNodeType, NodeTypeConfig> = {
  trigger:       { label: "Gatilho",           color: "hsl(142 60% 45%)",  icon: "Zap",              category: "trigger",  description: "Inicia o fluxo" },
  sendText:      { label: "Enviar Texto",      color: "hsl(210 80% 55%)",  icon: "MessageSquare",    category: "message",  description: "Envia mensagem de texto" },
  sendImage:     { label: "Enviar Imagem",     color: "hsl(280 60% 55%)",  icon: "Image",            category: "message",  description: "Envia uma imagem" },
  sendAudio:     { label: "Enviar Áudio",      color: "hsl(330 60% 55%)",  icon: "Mic",              category: "message",  description: "Envia um áudio" },
  sendVideo:     { label: "Enviar Vídeo",      color: "hsl(200 70% 50%)",  icon: "Video",            category: "message",  description: "Envia um vídeo" },
  sendFile:      { label: "Enviar Arquivo",    color: "hsl(30 70% 50%)",   icon: "FileText",         category: "message",  description: "Envia um arquivo" },
  sendButtons:   { label: "Botões",            color: "hsl(170 60% 45%)",  icon: "LayoutGrid",       category: "message",  description: "Envia botões interativos" },
  sendList:      { label: "Lista",             color: "hsl(190 60% 45%)",  icon: "List",             category: "message",  description: "Envia lista de opções" },
  condition:     { label: "Condição",          color: "hsl(0 65% 50%)",    icon: "GitBranch",        category: "logic",    description: "Bifurca o fluxo" },
  waitDelay:     { label: "Atraso",            color: "hsl(45 80% 50%)",   icon: "Clock",            category: "logic",    description: "Aguarda um tempo" },
  waitForReply:  { label: "Esperar Resposta",  color: "hsl(200 50% 50%)",  icon: "MessageCircle",    category: "logic",    description: "Aguarda resposta do contato" },
  waitForClick:  { label: "Aguardar Clique",   color: "hsl(35 70% 50%)",   icon: "MousePointerClick",category: "logic",    description: "Aguarda clique no link" },
  action:        { label: "Ação",              color: "hsl(25 80% 50%)",   icon: "Cog",              category: "action",   description: "Executa uma ação" },
  randomizer:    { label: "Randomizador",      color: "hsl(290 50% 55%)",  icon: "Shuffle",          category: "logic",    description: "Distribui aleatoriamente" },
  aiAgent:       { label: "Agente IA",         color: "hsl(270 70% 60%)",  icon: "Sparkles",         category: "ai",       description: "Gera resposta com IA" },
};

export const FINALIZER_TYPES: FlowNodeType[] = ["waitForReply", "waitForClick"];

export const categoryLabels: Record<string, string> = {
  trigger: "Gatilhos",
  message: "Mensagens",
  logic: "Lógica",
  action: "Ações",
  ai: "Inteligência Artificial",
};

export const operatorLabels: Record<string, string> = {
  equals: "igual a",
  contains: "contém",
  startsWith: "começa com",
  regex: "regex",
  has_tag: "tem tag",
};

export const triggerTypeLabels: Record<string, string> = {
  keyword: "Palavra-chave",
  first_message: "Primeira mensagem",
  schedule: "Agendado",
  webhook: "Webhook",
};

export const actionTypeLabels: Record<string, string> = {
  assignAgent: "Transferir",
  closeChat: "Fechar Chat",
  setTag: "Adicionar Tag",
  removeTag: "Remover Tag",
  httpRequest: "HTTP Request",
};

export function parseWhatsAppFormatting(text: string): string {
  return text
    .replace(/\*(.*?)\*/g, "<b>$1</b>")
    .replace(/_(.*?)_/g, "<i>$1</i>")
    .replace(/~(.*?)~/g, "<s>$1</s>");
}

export function formatDelay(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = seconds / 60;
  if (m < 60) return `${Math.round(m)}min`;
  return `${Math.round(m / 60)}h`;
}

export function getDefaultNodeData(type: FlowNodeType): FlowNodeData {
  const config = nodeTypeConfig[type];
  const base: FlowNodeData = { type, label: config.label };

  switch (type) {
    case "trigger":
      return { ...base, triggerType: "keyword", triggerValue: "" };
    case "sendText":
      return { ...base, textContent: "" };
    case "sendImage":
    case "sendVideo":
      return { ...base, mediaUrl: "", caption: "" };
    case "sendAudio":
      return { ...base, audioUrl: "", simulateRecording: false };
    case "sendFile":
      return { ...base, fileUrl: "", fileName: "" };
    case "sendButtons":
      return { ...base, textContent: "", buttons: [{ id: "1", text: "Opção 1" }] };
    case "sendList":
      return { ...base, textContent: "", listSections: [{ title: "Seção", rows: [{ id: "1", title: "Item 1" }] }] };
    case "condition":
      return { ...base, conditionField: "message", conditionOperator: "contains", conditionValue: "" };
    case "waitDelay":
      return { ...base, delaySeconds: 3, simulateTyping: true, delayPresenceType: "typing" };
    case "waitForReply":
      return { ...base, replyVariable: "reply", replyTimeout: 5, replyTimeoutUnit: "minutes" };
    case "waitForClick":
      return { ...base, clickUrl: "", clickTimeout: 5, clickTimeoutUnit: "minutes" };
    case "action":
      return { ...base, actionType: "assignAgent", actionValue: "" };
    case "randomizer":
      return { ...base, paths: 2 };
    case "aiAgent":
      return { ...base, aiSystemPrompt: "", aiModel: "google/gemini-2.5-flash", aiTemperature: 0.7, aiMaxTokens: 1024, aiHistoryCount: 10, aiAutoSend: true };
    default:
      return base;
  }
}
