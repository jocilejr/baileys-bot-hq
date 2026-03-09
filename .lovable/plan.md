

## Fix: Import `makeInMemoryStore`

O `makeInMemoryStore` não é uma named export do Baileys v6. Precisa ser importado separadamente.

### Alteração em `server/src/baileys-manager.ts`

Remover `makeInMemoryStore` da importação principal e adicionar um import separado:

```typescript
// Remover makeInMemoryStore daqui:
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  WASocket,
  proto,
} from "@whiskeysockets/baileys";

// Adicionar import separado:
import { makeInMemoryStore } from "@whiskeysockets/baileys";
```

Se o named import também falhar, usar o default import do subpath:

```typescript
import makeInMemoryStore from "@whiskeysockets/baileys/lib/Store/make-in-memory-store";
```

Apenas uma linha de import precisa mudar. Nenhuma outra alteração necessária.

