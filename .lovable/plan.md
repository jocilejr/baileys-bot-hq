

## Plano: Instalador 100% Autônomo do ZapManager

### Objetivo

Reescrever completamente o `install.sh` para que o sistema seja **totalmente independente**. O usuário fornece apenas 5 informações:

1. Dominio do frontend
2. Dominio da API
3. Email para SSL
4. Email do admin
5. Senha do admin

Tudo mais (Supabase self-hosted, chaves, banco, migrations, Baileys) e configurado automaticamente.

### Arquivos a criar/modificar

| Arquivo | Acao |
|---|---|
| `install.sh` | Reescrever completo |
| `migrations/init.sql` | Criar com todas as tabelas, enums, RLS, triggers, funcoes |
| `ecosystem.config.js` | Corrigir script path para producao |
| `server/src/setup-admin.ts` | Adaptar para receber args via env (sem interativo) |
| `.env.production.template` | Template para o frontend com variaveis do Supabase local |

### Fluxo do instalador

```text
Entrada do usuario:
  DOMAIN, API_DOMAIN, SSL_EMAIL, ADMIN_EMAIL, ADMIN_PASSWORD

1. Instalar dependencias (Node 20, PM2, Nginx, Docker, Certbot)
2. Clonar repositorio
3. Instalar Supabase Docker self-hosted
   a. git clone supabase/supabase -> /opt/supabase
   b. Gerar senhas automaticas (POSTGRES_PASSWORD, JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY)
   c. Configurar .env ANTES do primeiro boot
   d. Desabilitar analytics (causa bloqueio)
   e. docker compose up -d
   f. Aguardar health checks (db, auth, rest)
4. Executar migrations (init.sql) via docker exec com usuario postgres em modo trust temporario
5. Configurar frontend (.env.production apontando para Supabase local)
6. Build frontend
7. Configurar backend (server/.env com keys locais)
8. Build e instalar backend
9. Criar admin automaticamente (sem interacao)
10. Nginx (frontend + API + Supabase dashboard)
11. SSL via Certbot
12. PM2 start
```

### Correcoes de bugs conhecidos

**1. Senha do PostgreSQL / roles internas**

O Supabase Docker inicializa roles (`supabase_admin`, `supabase_auth_admin`) com a senha do `POSTGRES_PASSWORD` no primeiro boot. Se o volume ja existir com senha diferente, falha. Solucao:

- Sempre `docker compose down -v` antes do primeiro `up`
- Gerar `POSTGRES_PASSWORD` automaticamente e injetar no `.env` ANTES do boot
- Usar `pg_isready` para confirmar que o banco aceitou conexoes antes de rodar migrations

**2. Analytics bloqueando servicos**

O container `supabase-analytics` (Logflare) frequentemente falha e bloqueia kong/auth/rest por causa do `depends_on: condition: service_healthy`. Solucao:

- Usar `sed` para trocar `service_healthy` por `service_started` no docker-compose.yml do Supabase
- Opcionalmente desabilitar analytics completamente (nao e critico)

**3. Geracao automatica de JWT keys**

O Supabase precisa de `JWT_SECRET`, `ANON_KEY` e `SERVICE_ROLE_KEY`. Estas sao derivadas do JWT_SECRET usando payloads especificos. O instalador vai:

- Gerar um `JWT_SECRET` aleatorio
- Usar `node` inline para gerar `ANON_KEY` e `SERVICE_ROLE_KEY` com os payloads corretos do Supabase (`role: anon` e `role: service_role`)

**4. Migration SQL robusta**

Criar `migrations/init.sql` com:

- `DO $$ ... IF NOT EXISTS` para todos os enums
- `CREATE TABLE IF NOT EXISTS` para todas as tabelas
- `DROP POLICY IF EXISTS` + `CREATE POLICY` para RLS
- `DROP TRIGGER IF EXISTS` + `CREATE TRIGGER` para triggers
- Funcoes com `CREATE OR REPLACE`
- Nao criar trigger em `auth.users` diretamente (usar funcao do Supabase `handle_new_user` via API)

**5. PM2 ecosystem corrigido**

O `ecosystem.config.js` atual usa `--import tsx dist/index.js` que nao funciona em producao sem tsx instalado. Corrigir para usar o JS compilado diretamente ou garantir tsx como dependencia.

### Detalhes tecnicos do init.sql

Tabelas a criar (baseado no schema atual do Lovable Cloud):

- `user_roles` (com enum `app_role`: admin, moderator, user, supervisor)
- `profiles`
- `instances` (com enum `instance_status`)
- `contacts`
- `conversations` (com enum `conversation_status`)
- `messages` (com enum `message_status`, `message_direction`)
- `campaigns` (com enum `campaign_status`)
- `campaign_messages`
- `automation_flows` (com enum `trigger_type`)
- `quick_replies`
- `settings`

Funcoes: `update_updated_at_column`, `has_role`, `handle_new_user`
Triggers: `updated_at` em todas as tabelas relevantes, `on_auth_user_created` em `auth.users`
Storage bucket: `automation-media` (public)

### Detalhes tecnicos da geracao de keys

```bash
JWT_SECRET=$(openssl rand -hex 32)

# Gerar ANON_KEY (role=anon, iss=supabase, exp=10 anos)
ANON_KEY=$(node -e "
  const header = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    role:'anon',
    iss:'supabase',
    iat:Math.floor(Date.now()/1000),
    exp:Math.floor(Date.now()/1000)+315360000
  })).toString('base64url');
  const crypto = require('crypto');
  const sig = crypto.createHmac('sha256','$JWT_SECRET').update(header+'.'+payload).digest('base64url');
  console.log(header+'.'+payload+'.'+sig);
")

# SERVICE_ROLE_KEY (role=service_role, mesma logica)
```

### Nginx com 3 server blocks

- `$DOMAIN` -> frontend estático (`/opt/zapmanager/dist`)
- `$API_DOMAIN` -> proxy para `localhost:3001` (Baileys API)
- `supabase.$DOMAIN` -> proxy para `localhost:8000` (Kong/Supabase API)

O frontend usara `https://supabase.$DOMAIN` como `VITE_SUPABASE_URL`.

### setup-admin.ts nao-interativo

Modificar para aceitar `ADMIN_EMAIL` e `ADMIN_PASSWORD` como variaveis de ambiente, eliminando o readline interativo durante a instalacao.

