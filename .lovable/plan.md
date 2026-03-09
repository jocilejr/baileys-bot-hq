

## Complete Rewrite of `install.sh`

### Root Causes of All Failures

1. **Password sync impossible**: `ALTER ROLE supabase_auth_admin` fails because Supabase Docker marks these roles as "reserved" -- even the `postgres` user can't modify them after boot. This is a known issue (GitHub #41953).

2. **Init script variable substitution fails silently**: Supabase's `volumes/db/roles.sql` uses `\set pgpass` to read `POSTGRES_PASSWORD` from the environment, but this psql variable substitution can silently fail depending on how the container starts, leaving roles with wrong passwords.

3. **Health check gets 401 from Kong**: The curl to `/auth/v1/health` returns 401 because Kong requires an `apikey` header. The script interprets this as "auth not ready" and waits forever.

4. **Bind-mounted data survives `docker compose down -v`**: The `volumes/db/data` directory is bind-mounted (not a Docker volume), so `-v` doesn't clean it. Old data with old passwords persists.

### Solution: Patch `roles.sql` Before First Boot

Instead of trying to ALTER ROLE after boot, **hardcode the generated password directly into `volumes/db/roles.sql`** before the first `docker compose up`. This runs during DB initialization as the true superuser, before any other service connects.

### All Changes in `install.sh`

**1. Clean bind-mounted data too** (before `docker compose up`):
```bash
docker compose down -v 2>/dev/null || true
rm -rf volumes/db/data  # bind-mounted dir survives -v
```

**2. Patch `roles.sql` with hardcoded password** (after writing `.env`, before boot):
```bash
# Replace \set pgpass variable with hardcoded password in roles.sql
if [ -f "volumes/db/roles.sql" ]; then
  sed -i "s|\\\\set pgpass.*|-- password set inline|g" volumes/db/roles.sql
  sed -i "s|:'pgpass'|'${POSTGRES_PASSWORD}'|g" volumes/db/roles.sql
  sed -i "s|:pgpass|'${POSTGRES_PASSWORD}'|g" volumes/db/roles.sql
fi
```

**3. Remove the post-boot ALTER ROLE block entirely** -- no longer needed.

**4. Fix auth health check** to include apikey header:
```bash
until curl -sf http://localhost:8000/auth/v1/health \
  -H "apikey: $ANON_KEY" > /dev/null 2>&1; do
```

**5. Add diagnostic output on failure** -- if any health check times out, automatically dump the last 20 lines of the relevant container log.

**6. Add `set -euo pipefail`** for stricter error handling.

### Files to Modify

| File | Change |
|---|---|
| `install.sh` | Full rewrite with all fixes above |

### Step-by-step flow (unchanged structure, fixed internals)

```text
[1/11] System deps (same)
[2/11] Clone repo (same)
[3/11] Supabase self-hosted:
       - Clone Supabase repo
       - Generate secrets
       - Write .env
       - Patch roles.sql with hardcoded password  ← NEW
       - Fix docker-compose.yml (service_healthy → service_started)
       - Clean old data (volumes + bind mounts)   ← IMPROVED
       - docker compose up -d
       - Wait for DB (pg_isready)
       - NO ALTER ROLE                             ← REMOVED
       - Wait for auth (with apikey header)        ← FIXED
       - Wait for REST
[4/11] Run migrations (same)
[5-8]  Frontend/backend build (same)
[9/11] Create admin (same)
[10-11] Nginx + SSL (same)
PM2 start (same)
```

