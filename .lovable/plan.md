

# Plano: Tornar o ZapManager Funcional com Supabase + Baileys

## Problema
Atualmente todas as páginas usam dados mock (hardcoded). Não há banco de dados, autenticação, nem integração com a API Baileys. Além disso, **não há Supabase conectado ao projeto**.

## Pré-requisito: Conectar Supabase
Antes de qualquer implementação, é necessário conectar o projeto ao Supabase (via Lovable Cloud ou projeto externo). Sem isso, não é possível criar tabelas, edge functions nem autenticação.

**Recomendo usar Lovable Cloud** (opção mais simples) -- basta ativar pelo painel.

---

## Etapa 1: Banco de Dados (Tabelas Supabase)

Criação das tabelas principais com RLS:

- **profiles** — dados do usuário (name, avatar_url, linked a auth.users)
- **user_roles** — roles (admin, supervisor, atendente) com enum `app_role`
- **instances** — instâncias WhatsApp (name, phone, status, api_url, session_data)
- **contacts** — contatos/CRM (name, phone, tags, custom_fields, instance_id)
- **conversations** — conversas (contact_id, instance_id, status, assigned_to, department, last_message_at)
- **messages** — mensagens (conversation_id, content, media_url, direction, status, timestamp)
- **automation_flows** — fluxos de automação (name, trigger_type, trigger_value, blocks JSON, active, instance_ids)
- **campaigns** — disparos em massa (name, status, template, recipients, schedule, stats)
- **campaign_messages** — mensagens individuais de campanha (campaign_id, contact_id, status)
- **settings** — configurações globais (key/value: api_url, token, business_hours, welcome_msg, webhooks)
- **quick_replies** — respostas rápidas (title, content, shortcut)

Função `has_role()` (SECURITY DEFINER) para RLS seguro.

## Etapa 2: Edge Functions (Supabase)

Edge functions que fazem proxy para a API Baileys na VPS:

1. **baileys-proxy** — proxy genérico para a API Baileys (create/delete instance, get QR code, send message, get status). Lê a URL da API e token da tabela `settings`. Valida autenticação e role.

2. **webhook-receiver** — recebe webhooks do Baileys (nova mensagem, status update) e grava no banco (messages, conversations).

3. **campaign-sender** — processa envio de campanhas com delay anti-ban (invocada por cron ou manualmente).

## Etapa 3: Serviços Frontend (hooks/services)

Criar hooks React Query para cada recurso:

- `useInstances()` — CRUD instâncias + connect/disconnect via edge function
- `useConversations()` — listar conversas, filtrar por departamento/status
- `useMessages(conversationId)` — mensagens de uma conversa + envio via edge function
- `useContacts()` — CRUD contatos com busca e filtros
- `useAutomations()` — CRUD fluxos de automação
- `useCampaigns()` — CRUD campanhas + disparo
- `useSettings()` — ler/salvar configurações
- `useDashboardStats()` — métricas agregadas

## Etapa 4: Conectar Páginas

Substituir dados mock por hooks reais em cada página:
- **Dashboard** — `useDashboardStats()` + `useInstances()`
- **Chat** — `useConversations()` + `useMessages()` + envio real via Baileys
- **Contatos** — `useContacts()` com CRUD completo
- **Automações** — `useAutomations()` com toggle ativo/inativo
- **Disparos** — `useCampaigns()` com criação e acompanhamento
- **Instâncias** — `useInstances()` com QR code real e status
- **Configurações** — `useSettings()` com persistência

---

## Escopo e Sequência

Este é um projeto **muito grande**. Recomendo dividir em fases:

1. **Fase 1**: Ativar Lovable Cloud/Supabase → criar banco de dados → criar `baileys-proxy` edge function → tornar Instâncias funcional (CRUD + QR code)
2. **Fase 2**: Chat funcional (conversas + mensagens via Baileys) + webhook-receiver
3. **Fase 3**: Contatos CRM + Configurações persistentes
4. **Fase 4**: Automações + Disparos em massa

## Próximo Passo Necessário

**Você precisa primeiro ativar o Lovable Cloud** (ou conectar um projeto Supabase externo) para que eu possa criar as tabelas e edge functions. Deseja ativar o Lovable Cloud agora?

