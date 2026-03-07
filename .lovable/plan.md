

# Plano: Backend Baileys Integrado + Deploy VPS com install.sh

## Visao geral da arquitetura

```text
┌─────────────────────────┐     ┌──────────────────────────────┐
│   Frontend (site.com)   │────▶│   Backend (api.site.com)     │
│   React + Vite (build)  │     │   Node.js + Express + Baileys│
│   Servido pelo Nginx    │     │   Conecta direto ao Supabase │
└─────────────────────────┘     └──────────────────────────────┘
                                          │
                                          ▼
                                ┌──────────────────┐
                                │  Supabase Cloud   │
                                │  (banco de dados) │
                                └──────────────────┘
```

O frontend faz chamadas HTTP para `api.site.com`. O backend Node.js roda Baileys nativamente, gerencia sessoes WhatsApp e grava tudo no Supabase. Nenhuma configuracao de API URL/token e necessaria pelo usuario.

---

## Mudancas

### 1. Criar `server/` — Backend Node.js completo

**`server/package.json`** — Dependencias: `express`, `cors`, `@whiskeysockets/baileys`, `@supabase/supabase-js`, `qrcode`, `dotenv`, `pino`

**`server/src/index.ts`** — Express server principal:
- Porta 3001 (configuravel via env)
- CORS configurado para aceitar o dominio do frontend
- Middleware de auth: valida JWT do Supabase em cada request
- Rotas montadas em `/api/`

**`server/src/baileys-manager.ts`** — Gerenciador de sessoes Baileys:
- `startSession(instanceId)` — cria conexao Baileys, salva QR code no Supabase via webhook-receiver pattern, gerencia reconexao automatica
- `stopSession(instanceId)` — desconecta
- `getStatus(instanceId)` — retorna status da conexao
- `sendMessage(instanceId, to, content)` — envia mensagem
- Sessoes persistidas em disco (`./sessions/`)
- Eventos: `connection.update` atualiza status na tabela `instances`, `messages.upsert` insere mensagens na tabela `messages` via Supabase client
- Auto-reconexao com backoff exponencial

**`server/src/routes/instances.ts`** — CRUD de instancias:
- `GET /api/instances` — lista
- `POST /api/instances` — cria e inicia sessao Baileys
- `DELETE /api/instances/:id` — para sessao e remove
- `POST /api/instances/:id/reconnect` — reconecta
- `GET /api/instances/:id/status` — status + QR code

**`server/src/routes/messages.ts`** — Envio de mensagens:
- `POST /api/messages/send` — envia via Baileys, grava no Supabase

**`server/src/routes/health.ts`** — Health check:
- `GET /api/health` — retorna status do servidor e das sessoes ativas

**`server/.env.example`**:
```
SUPABASE_URL=https://lyslqcapgawzffivlgjh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
PORT=3001
CORS_ORIGIN=https://site.com
```

### 2. Criar `server/src/setup-admin.ts` — Script de criacao do admin

- Roda uma vez durante o `install.sh`
- Recebe email e senha via prompt interativo
- Cria usuario no Supabase Auth via Admin API (service role key)
- Insere role `admin` na tabela `user_roles`
- Grava no `.env` um flag `ADMIN_CREATED=true` para evitar re-criacao

### 3. Criar arquivos de deploy

**`install.sh`** — Script principal:
- Instala Node.js 20, Nginx, Certbot, PM2
- Clona o repositorio
- Pede ao usuario: dominio, subdominio da API, email admin, senha admin
- Roda `npm install` e `npm run build` no frontend
- Roda `npm install` no server
- Configura Nginx (site.com serve o build estatico, api.site.com faz proxy para :3001)
- Gera certificados SSL com Certbot
- Roda o script de setup-admin
- Inicia o backend com PM2
- Exibe resumo final com URL de acesso

**`nginx.conf.template`** — Template Nginx:
- `site.com` → serve `dist/` (build do Vite)
- `api.site.com` → proxy_pass para `localhost:3001`

**`ecosystem.config.js`** — Configuracao PM2 para o backend

### 4. Modificar frontend — Comunicacao direta com backend

**`src/hooks/useInstances.ts`** — Reescrever:
- Remover `useBaileysProxy` (nao usa mais edge function)
- Adicionar helper `apiCall(path, options)` que faz fetch para `VITE_API_URL` com JWT do Supabase no header
- Instancias ainda vem do Supabase (tabela), mas acoes (criar, reconectar, deletar) chamam o backend Node.js diretamente

**`src/lib/api.ts`** — Novo helper:
- `apiClient.get/post/delete(path)` — fetch com `Authorization: Bearer ${session.access_token}`
- Base URL via `VITE_API_URL` (ex: `https://api.site.com/api`)

### 5. Modificar `src/pages/Configuracoes.tsx` — Remover API URL/token

- Remover tab "Geral" com campos de API URL e Token
- Adicionar tab "Baileys" com:
  - Status da conexao (online/offline) via `GET /api/health`
  - Lista de sessoes ativas com status individual
  - Botao "Testar Conexao" que faz ping no backend
  - Indicador visual (verde = online, vermelho = offline)
- Manter tabs: Horario, Mensagens, Webhooks

### 6. Adicionar autenticacao — Login sem signup

**`src/pages/Login.tsx`** — Pagina de login:
- Formulario com email e senha
- Sem link de "Criar conta" / signup
- Redirect para `/` apos login
- Visual consistente com o tema escuro

**`src/components/AuthGuard.tsx`** — Protecao de rotas:
- Verifica sessao do Supabase
- Redireciona para `/login` se nao autenticado
- Mostra loading enquanto verifica

**`src/App.tsx`** — Atualizar:
- Rota `/login` publica
- Todas as outras rotas dentro de `AuthGuard`
- Remover rota `/instancias` (gerenciamento agora e interno, visivel apenas em Configuracoes > Baileys)

**`src/components/AppSidebar.tsx`** — Atualizar:
- Remover item "Instancias" do menu
- Adicionar botao de logout no footer

### 7. Remover edge function `baileys-proxy`

- Deletar `supabase/functions/baileys-proxy/index.ts`
- Remover entrada do `supabase/config.toml`
- Manter `webhook-receiver` (ainda util para webhooks externos)

### 8. Remover pagina de Instancias

- A pagina `/instancias` e removida como rota
- A funcionalidade de gerenciar instancias (criar, reconectar, QR code) vai para dentro de Configuracoes > Baileys
- Simplifica a UX: o admin ve o status e gerencia tudo em um lugar

---

## Resumo de arquivos

| Acao | Arquivo |
|------|---------|
| Criar | `server/package.json`, `server/src/index.ts`, `server/src/baileys-manager.ts`, `server/src/routes/*.ts`, `server/src/setup-admin.ts`, `server/.env.example` |
| Criar | `install.sh`, `nginx.conf.template`, `ecosystem.config.js` |
| Criar | `src/pages/Login.tsx`, `src/components/AuthGuard.tsx`, `src/lib/api.ts` |
| Editar | `src/pages/Configuracoes.tsx`, `src/hooks/useInstances.ts`, `src/App.tsx`, `src/components/AppSidebar.tsx` |
| Remover | `supabase/functions/baileys-proxy/index.ts`, `src/pages/Instancias.tsx` |

