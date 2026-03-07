

# Plano: Supabase Self-Hosted na VPS

## O que muda

Atualmente o projeto aponta para o Supabase Cloud (hospedado). Voce quer que o `install.sh` instale o **Supabase localmente na VPS** via Docker, assim como instala o Baileys, e que o backend e frontend usem essa instancia local automaticamente.

## Arquitetura final

```text
VPS (sua maquina)
├── Docker
│   └── Supabase (PostgreSQL, Auth, Storage, REST API)
│       ├── PostgreSQL :5432
│       ├── Kong API Gateway :8000
│       ├── GoTrue Auth :9999
│       └── Studio (dashboard) :3000
├── Node.js + Express + Baileys :3001
├── Nginx
│   ├── app.chatbotsimplificado.com → dist/ (frontend)
│   ├── api.chatbotsimplificado.com → localhost:3001
│   └── supabase.chatbotsimplificado.com → localhost:8000
└── PM2 (gerencia o backend Node.js)
```

Tudo roda na VPS. Zero dependencia externa.

## Mudancas

### 1. `install.sh` — Instalar Supabase Self-Hosted via Docker

- Instalar Docker e Docker Compose automaticamente
- Clonar o repositorio oficial `supabase/supabase` (pasta `docker/`)
- Gerar automaticamente as chaves JWT (anon key, service role key) usando `openssl`
- Configurar o `.env` do Supabase Docker com:
  - `POSTGRES_PASSWORD` (gerado automaticamente)
  - `JWT_SECRET` (gerado automaticamente)
  - `ANON_KEY` e `SERVICE_ROLE_KEY` (gerados via JWT com o secret)
  - `SITE_URL` e `API_EXTERNAL_URL` apontando para o dominio
- Subir os containers com `docker compose up -d`
- Aguardar o Supabase ficar pronto (health check no Kong)
- Rodar as migrations SQL (criar tabelas, enums, funcoes, RLS policies) automaticamente
- Remover os prompts de `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` — tudo e gerado automaticamente

### 2. `install.sh` — Criar arquivo de migrations SQL

- Novo arquivo `migrations/init.sql` com toda a estrutura do banco:
  - Enums: `app_role`, `instance_status`, `conversation_status`, `message_status`, `trigger_type`, `campaign_status`
  - 11 tabelas: `profiles`, `user_roles`, `instances`, `contacts`, `conversations`, `messages`, `automation_flows`, `campaigns`, `campaign_messages`, `settings`, `quick_replies`
  - Funcoes: `has_role()`, `handle_new_user()`, `update_updated_at_column()`
  - Triggers
  - Todas as RLS policies existentes
- Executado automaticamente via `psql` contra o PostgreSQL local

### 3. `install.sh` — Configurar frontend e backend com URLs locais

- O `.env.production` do frontend recebe:
  ```
  VITE_SUPABASE_URL=https://supabase.chatbotsimplificado.com
  VITE_SUPABASE_PUBLISHABLE_KEY=<anon_key_gerada>
  VITE_API_URL=https://api.chatbotsimplificado.com/api
  ```
- O `.env` do server recebe:
  ```
  SUPABASE_URL=http://localhost:8000
  SUPABASE_SERVICE_ROLE_KEY=<service_role_key_gerada>
  ```

### 4. `install.sh` — Adicionar Nginx para Supabase

- Novo server block para `supabase.chatbotsimplificado.com` fazendo proxy para `localhost:8000`
- SSL via Certbot para os 3 subdominios

### 5. `install.sh` — Fluxo simplificado

O script final pede apenas:
1. Dominio do frontend
2. Subdominio da API
3. Subdominio do Supabase (ou usa `supabase.` por padrao)
4. Email para SSL
5. URL do repositorio Git (se primeira vez)
6. Email e senha do admin

Tudo mais (PostgreSQL, chaves JWT, tabelas, RLS) e gerado e configurado automaticamente.

### 6. `server/.env.example` — Atualizar

Refletir que os valores sao gerados pelo install.sh, nao digitados manualmente.

### 7. Novo arquivo `migrations/init.sql`

Contem toda a estrutura do banco extraida do schema atual do projeto, para ser executada no PostgreSQL local.

## Resumo de arquivos

| Acao | Arquivo |
|------|---------|
| Reescrever | `install.sh` |
| Criar | `migrations/init.sql` |
| Atualizar | `server/.env.example` |
| Atualizar | `ecosystem.config.js` (adicionar health check) |

