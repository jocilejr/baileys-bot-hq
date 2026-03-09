

## Problema: CORS bloqueando chamadas ao backend

A imagem mostra erros de CORS ao tentar acessar `https://api.chatbotsimplificado.com/api/health` a partir de `https://app.chatbotsimplificado.com`. O backend Express está configurado com `CORS_ORIGIN` do `.env`, mas provavelmente esse valor não está correto na VPS.

### Causa raiz

No `server/src/index.ts` linha 31:
```js
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
```

O `server/.env` na VPS provavelmente tem `CORS_ORIGIN` com valor errado ou não definido corretamente. Quando `credentials: true` é usado com `origin: "*"`, o CORS bloqueia (essa combinação é inválida na especificação CORS).

### Correção

Duas mudanças:

1. **No servidor Express** (`server/src/index.ts`): Corrigir a configuração CORS para aceitar múltiplas origens e funcionar corretamente com credenciais:
```js
app.use(cors({ 
  origin: process.env.CORS_ORIGIN?.split(",") || "*", 
  credentials: true 
}));
```

2. **Na VPS**: Verificar/atualizar o `server/.env` para incluir a origem correta:
```
CORS_ORIGIN=https://app.chatbotsimplificado.com
```

Depois reiniciar: `pm2 restart zapmanager-api`

### Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `server/src/index.ts` | Melhorar config CORS para suportar lista de origens |

### Ação na VPS após deploy
```bash
# Editar o .env do server
nano /root/baileys-bot-hq/server/.env
# Garantir que CORS_ORIGIN=https://app.chatbotsimplificado.com

# Rebuild e restart
cd /root/baileys-bot-hq/server
npx tsc
pm2 restart zapmanager-api
```

