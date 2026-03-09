

## Fix: PM2 ESM Error

### Problem
`ecosystem.config.js` uses `module.exports` (CommonJS) but `package.json` has `"type": "module"`, causing Node to reject it.

### Fix
Rename `ecosystem.config.js` → `ecosystem.config.cjs` (same content, forces CommonJS mode).

Update `install.sh` to reference the new filename.

### Files

| File | Change |
|---|---|
| `ecosystem.config.cjs` | Create with same content as current `ecosystem.config.js` |
| `ecosystem.config.js` | Delete (replaced by `.cjs`) |
| `install.sh` | Change `pm2 start ecosystem.config.js` → `pm2 start ecosystem.config.cjs` |

### After deploying
Run on VPS:
```bash
cd /opt/zapmanager && git pull
pm2 start ecosystem.config.cjs
```

