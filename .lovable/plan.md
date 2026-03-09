

## Fix: Import `makeInMemoryStore` corretamente

O TypeScript confirma que `makeInMemoryStore` é um **default export**, não named. A mensagem de erro sugere exatamente isso.

### Alteração (linha 9 de `server/src/baileys-manager.ts`):

```typescript
// De:
import { makeInMemoryStore } from "@whiskeysockets/baileys";

// Para:
import makeInMemoryStore from "@whiskeysockets/baileys/lib/Store/make-in-memory-store";
```

Se esse subpath não existir no pacote instalado, a alternativa é:

```typescript
const { makeInMemoryStore } = await import("@whiskeysockets/baileys");
```

Apenas a linha 9 muda. Nenhuma outra alteração.

