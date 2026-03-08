

## Plano: Corrigir install.sh com todas as variáveis de ambiente do Supabase Docker

### Problema

O `install.sh` atual gera um `.env` com apenas ~20 variáveis, mas o `docker-compose.yml` do Supabase exige ~45+. As variáveis faltantes causam:

1. **Warnings "variable is not set"** para POOLER_*, SECRET_KEY_BASE, VAULT_ENC_KEY, PG_META_CRYPTO_KEY, SMTP_*, KONG_*, DOCKER_SOCKET_LOCATION, etc.
2. **Erro fatal**: `invalid spec: :/var/run/docker.sock:ro,z: empty section between colons` -- porque `DOCKER_SOCKET_LOCATION` está vazio, gerando um mount path inválido no container `vector`
3. Containers Kong, Auth, REST nunca sobem porque dependem de containers que falham

### Correção

Reescrever a seção de geração do `.env` (linhas 90-185 do `install.sh`) para incluir **todas** as variáveis do `.env.example` oficial do Supabase:

**Variáveis a adicionar (que estão faltando):**

| Variável | Valor |
|---|---|
| `SECRET_KEY_BASE` | `$(openssl rand -base64 48)` |
| `VAULT_ENC_KEY` | `$(openssl rand -hex 16)` |
| `PG_META_CRYPTO_KEY` | `$(openssl rand -hex 16)` |
| `LOGFLARE_PUBLIC_ACCESS_TOKEN` | `$(openssl rand -hex 32)` |
| `LOGFLARE_PRIVATE_ACCESS_TOKEN` | `$(openssl rand -hex 32)` |
| `S3_PROTOCOL_ACCESS_KEY_ID` | `$(openssl rand -hex 16)` |
| `S3_PROTOCOL_ACCESS_KEY_SECRET` | `$(openssl rand -hex 32)` |
| `POOLER_PROXY_PORT_TRANSACTION` | `6543` |
| `POOLER_DEFAULT_POOL_SIZE` | `20` |
| `POOLER_MAX_CLIENT_CONN` | `100` |
| `POOLER_TENANT_ID` | `zapmanager` |
| `POOLER_DB_POOL_SIZE` | `5` |
| `KONG_HTTP_PORT` | `8000` |
| `KONG_HTTPS_PORT` | `8443` |
| `DOCKER_SOCKET_LOCATION` | `/var/run/docker.sock` |
| `ADDITIONAL_REDIRECT_URLS` | (vazio) |
| `JWT_EXPIRY` | `3600` |
| `DISABLE_SIGNUP` | `false` |
| `MAILER_URLPATHS_*` | `/auth/v1/verify` |
| `ENABLE_EMAIL_SIGNUP` | `true` |
| `ENABLE_EMAIL_AUTOCONFIRM` | `true` |
| `SMTP_HOST` | `supabase-mail` |
| `SMTP_PORT` | `2500` |
| `SMTP_USER` | `fake_mail_user` |
| `SMTP_PASS` | `fake_mail_password` |
| `SMTP_SENDER_NAME` | `ZapManager` |
| `ENABLE_PHONE_SIGNUP` | `false` |
| `ENABLE_PHONE_AUTOCONFIRM` | `false` |
| `ENABLE_ANONYMOUS_USERS` | `false` |
| `PGRST_DB_SCHEMAS` | `public,storage,graphql_public` |
| `GLOBAL_S3_BUCKET` | `stub` |
| `REGION` | `stub` |
| `STORAGE_TENANT_ID` | `stub` |
| `IMGPROXY_ENABLE_WEBP_DETECTION` | `true` |

### Arquivo a modificar

**`install.sh`** -- substituir linhas 90-185 (seção de geração do .env) com a versão completa contendo todas as variáveis acima, organizadas nas mesmas seções do `.env.example` oficial.

Também remover a linha `cp -n .env.example .env 2>/dev/null || true` (linha 129) que é desnecessária já que escrevemos o .env completo com `cat >`.

### Resultado esperado

Após esta correção:
- Zero warnings de variáveis não definidas
- O erro do `DOCKER_SOCKET_LOCATION` desaparece
- Todos os containers do Supabase sobem corretamente

