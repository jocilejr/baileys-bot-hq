

## Fix: Auth Password Authentication Failed

### Root Cause

The `supabase_auth_admin` role's password doesn't match `POSTGRES_PASSWORD`. Even with `docker compose down -v`, the Supabase Docker init scripts may not reliably set passwords for internal roles. The auth container then crashes in a loop because it can't connect to the database.

### Fix in `install.sh`

After the database is ready (line 265), **explicitly set the passwords** for internal roles using the `postgres` superuser (which IS superuser and CAN alter reserved roles), then restart the dependent services:

Replace line 267:
```bash
echo "  ✅ Senhas dos roles internos configuradas automaticamente pelo init"
```

With:
```bash
echo "  🔧 Configurando senhas dos roles internos..."
docker compose exec -T db psql -U postgres -c "ALTER ROLE supabase_auth_admin WITH PASSWORD '${POSTGRES_PASSWORD}';"
docker compose exec -T db psql -U postgres -c "ALTER ROLE supabase_storage_admin WITH PASSWORD '${POSTGRES_PASSWORD}';"
echo "  ✅ Senhas configuradas"

echo "  🔄 Reiniciando auth e storage..."
docker compose restart auth storage
sleep 5
```

### Why this works

- `postgres` user is the actual superuser and CAN modify reserved roles (the previous attempt failed because it used `supabase_admin` which is NOT superuser)
- After setting passwords, restarting auth/storage ensures they pick up the correct credentials
- The `sleep 5` gives containers time to initialize before the health check loop

### Files to modify

| File | Change |
|---|---|
| `install.sh` | Replace line 267 with password sync block using `-U postgres` |

