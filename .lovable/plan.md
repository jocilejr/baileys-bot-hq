

## Fix: Reserved Role Password Sync Error

### Problem

The `install.sh` fails at step "Sincronizando senhas dos roles internos" because it runs `ALTER ROLE supabase_auth_admin` using `-U supabase_admin`, which is not a superuser. The fallback with `-U postgres` also tries the same reserved roles.

In Supabase Docker, the `postgres` user IS a superuser but the initial password is set via `POSTGRES_PASSWORD`. Since you do `docker compose down -v` before boot, the password is correctly set on first boot -- meaning the roles already have the correct password from initialization. **The password sync step is unnecessary.**

### Fix in `install.sh`

**Remove the entire password sync block** (lines 146-165 approximately). The Supabase Docker init scripts already set all internal role passwords from `POSTGRES_PASSWORD` on first boot when volumes are fresh (which is guaranteed by the `docker compose down -v` above).

Replace the sync block with just a skip message, and remove the `docker compose restart auth storage` since it's no longer needed:

```bash
# DELETE these lines:
#   echo "  🔧 Sincronizando senhas dos roles internos..."
#   docker compose exec -T db psql -U supabase_admin ...
#   ...fallback...
#   echo "  ✅ Senhas sincronizadas"
#   docker compose restart auth storage

# REPLACE with:
echo "  ✅ Senhas dos roles internos configuradas automaticamente pelo init"
```

### Files to modify

| File | Change |
|---|---|
| `install.sh` | Remove the password sync block (~20 lines) and the `restart auth storage` command |

This is safe because `docker compose down -v` on line ~141 ensures fresh volumes, so Supabase's own init scripts set all passwords correctly from the `.env` file.

