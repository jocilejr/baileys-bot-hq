

## Problema raiz

O Supabase Docker cria roles internas (`supabase_admin`, `supabase_auth_admin`, etc.) com senhas definidas na **inicialização**. Quando você gera uma nova `POSTGRES_PASSWORD` e coloca no `.env`, os containers tentam conectar com a senha nova, mas o banco já foi criado com a senha padrão (ou anterior). Resultado: falha de autenticação em cascata.

A solução correta é **não tentar resetar senhas depois** — em vez disso, configurar o `.env` **antes** do primeiro `docker compose up`, e garantir que se o banco já existir, recriá-lo do zero.

## Plano: Reescrever `install.sh` com correções

### Mudanças principais

1. **Destruir volumes existentes antes de subir** — Antes do `docker compose up -d`, executar `docker compose down -v` para garantir que o banco seja criado limpo com as novas senhas.

2. **Usar a senha padrão do Supabase para roles internas** — O Supabase Docker usa a variável `POSTGRES_PASSWORD` do `.env` para configurar **todas** as roles internas automaticamente no primeiro boot. O problema atual é que o volume antigo persiste com senhas antigas. O `down -v` resolve isso.

3. **Aguardar o Auth ficar pronto** — Após o `docker compose up -d`, verificar não só o REST API (porta 8000), mas também o Auth service antes de rodar migrations e criar o admin.

4. **Migrations via REST API em vez de `psql` direto** — Usar `curl` contra o endpoint do Supabase com `SERVICE_ROLE_KEY` para evitar problemas de conexão direta ao container PostgreSQL. Alternativamente, manter o `psql` via `docker exec` mas usando o usuário `supabase_admin` (que funcionará porque o banco será criado limpo).

5. **Script `setup-admin.ts` não precisa de mudança** — Ele já usa a API do Supabase Auth Admin corretamente.

### Bloco de mudança no `install.sh` (seção Supabase)

Substituir a seção de Supabase por:

```text
# Limpar instalação anterior (se houver)
cd $SUPABASE_DIR/docker
docker compose down -v 2>/dev/null || true

# Configurar .env ANTES do primeiro boot
cp .env.example .env
sed -i ... (todas as substituições de senha/URL)

# Subir containers (banco será criado do zero com senhas corretas)
docker compose up -d

# Aguardar PostgREST + Auth
until curl -sf http://localhost:8000/rest/v1/ ...
until curl -sf http://localhost:8000/auth/v1/health ...

# Migrations via docker exec com supabase_admin (agora funciona)
docker exec supabase-db psql -U supabase_admin -d postgres -f /tmp/init.sql
```

### Correção do trigger `on_auth_user_created`

O `init.sql` cria um trigger em `auth.users`, que é um schema reservado do Supabase. Isso pode causar problemas. Mover para ser criado **após** o Supabase estar completamente inicializado, ou verificar se já existe antes de criar.

### Arquivos a modificar

- **`install.sh`** — Reescrever seção Supabase com `docker compose down -v` antes de subir, e melhor detecção de "pronto".
- **`deploy.sh`** — Mesmas mudanças (é uma cópia do install.sh).
- **`migrations/init.sql`** — Adicionar `IF NOT EXISTS` nos CREATE TYPE/TABLE e tratar o trigger `on_auth_user_created` com `DROP TRIGGER IF EXISTS` antes de criar.

### Solução imediata para o servidor atual

Para o servidor que já está rodando, a solução mais rápida seria:

```bash
cd /opt/supabase/docker
docker compose down -v    # Remove volumes (APAGA o banco)
docker compose up -d      # Recria tudo com senhas do .env
```

Isso funciona porque o `.env` já está configurado com as senhas corretas — o problema é apenas que o banco foi criado com senhas diferentes.

