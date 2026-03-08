

## Fix: Auth service password mismatch for `supabase_auth_admin`

### Root Cause

The Supabase Docker init SQL creates internal roles (`supabase_auth_admin`, `supabase_storage_admin`, etc.) with passwords derived from `POSTGRES_PASSWORD`. However, `docker compose down -v` may not fully clean up the DB volume if it was previously initialized with a different password, OR the init scripts sometimes fail to set the internal role passwords correctly.

The auth container connects as `supabase_auth_admin` and gets `FATAL: password authentication failed`.

### Fix

After the database is ready (line 265) but **before** waiting for auth/rest, add a step that forcefully resets all internal Supabase role passwords to match the current `POSTGRES_PASSWORD`. This ensures consistency regardless of volume state.

### Changes to `install.sh`

**After line 265** (`✅ Banco de dados pronto`), insert a new block:

```bash
# Reset internal role passwords to match current POSTGRES_PASSWORD
echo "  🔧 Sincronizando senhas dos roles internos..."
docker compose exec -T db psql -U supabase_admin -d postgres -c "
  ALTER ROLE supabase_auth_admin WITH PASSWORD '$POSTGRES_PASSWORD';
  ALTER ROLE supabase_storage_admin WITH PASSWORD '$POSTGRES_PASSWORD';
  ALTER ROLE supabase_admin WITH PASSWORD '$POSTGRES_PASSWORD';
  ALTER ROLE supabase_replication_admin WITH PASSWORD '$POSTGRES_PASSWORD';
  ALTER ROLE supabase_read_only_user WITH PASSWORD '$POSTGRES_PASSWORD';
" 2>/dev/null || {
  # Fallback: try as postgres user
  docker compose exec -T db psql -U postgres -d postgres -c "
    ALTER ROLE supabase_auth_admin WITH PASSWORD '$POSTGRES_PASSWORD';
    ALTER ROLE supabase_storage_admin WITH PASSWORD '$POSTGRES_PASSWORD';
    ALTER ROLE supabase_admin WITH PASSWORD '$POSTGRES_PASSWORD';
  "
}
echo "  ✅ Senhas sincronizadas"

# Restart auth and storage so they pick up the corrected passwords
docker compose restart auth storage
```

This guarantees `supabase_auth_admin` can authenticate with the password provided in the `.env`, resolving the SASL auth failure.

### Summary

| File | Change |
|---|---|
| `install.sh` (after line 265) | Add password reset for internal Supabase roles + restart auth/storage containers |

