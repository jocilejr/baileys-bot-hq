

## Fix: Admin creation failing because Auth service not ready

### Problem

The error `❌ Erro ao criar usuário: {}` happens because:

1. The Auth service health check timed out ("⚠️ Auth service demorou, mas continuando...")
2. The script continued anyway and by step 9, auth may still not be ready
3. The error object from Supabase client doesn't have a `.message` — it likely has `.msg` or is a network error, so it prints `{}`

### Changes

**1. `install.sh` — Better auth health check (lines 267-289)**

Replace the kong-based health check with a direct auth API call and increase retries. Also add a dedicated wait before admin creation:

```bash
# Wait for auth service - check via Kong endpoint directly
echo "  ⏳ Aguardando serviço de autenticação..."
RETRY=0
until curl -sf http://localhost:8000/auth/v1/health > /dev/null 2>&1; do
  RETRY=$((RETRY+1))
  if [ $RETRY -ge 90 ]; then
    echo "  ❌ Auth service não ficou pronto em 180s"
    echo "  Verifique: cd $SUPABASE_DIR/docker && docker compose logs auth"
    exit 1
  fi
  sleep 2
done
echo "  ✅ Auth service pronto"
```

Make the auth check **blocking** (exit on failure instead of continuing), and increase to 90 retries (180s).

Do the same for REST API — make it blocking.

**2. `install.sh` — Add retry logic before admin creation (around line 370)**

Add a wait-and-retry loop before calling setup-admin:

```bash
echo "🔐 [9/11] Criando conta de administrador..."
echo "  ⏳ Aguardando Auth API estar 100% operacional..."
sleep 10

cd $APP_DIR/server
RETRIES=0
until ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" npx tsx src/setup-admin.ts; do
  RETRIES=$((RETRIES+1))
  if [ $RETRIES -ge 3 ]; then
    echo "  ❌ Falha ao criar admin após 3 tentativas"
    exit 1
  fi
  echo "  ⏳ Tentando novamente em 15s..."
  sleep 15
done
```

**3. `server/src/setup-admin.ts` — Better error logging (line 49)**

Change error output to serialize the full error object:

```typescript
console.error("❌ Erro ao criar usuário:", userError.message || JSON.stringify(userError));
```

### Summary of changes

| File | Change |
|---|---|
| `install.sh` lines 267-289 | Make auth/REST health checks blocking with longer timeout |
| `install.sh` lines 367-373 | Add sleep + retry loop for admin creation |
| `server/src/setup-admin.ts` line 49 | Better error serialization |

