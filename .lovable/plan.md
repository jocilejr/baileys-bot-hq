

## Problema

Erro de compilação TypeScript: `identifier` é declarado como `let identifier: string` na linha 201, mas o TypeScript não consegue garantir que será atribuído em todos os caminhos de execução. Especificamente, quando `chatType === "private" && isLid` é `true` mas a API nativa do Baileys resolve com sucesso (sem entrar nos fallbacks), a variável `resolved` fica `true` e o bloco `if (!resolved)` é pulado — mas o TypeScript não rastreia isso através da flag booleana.

## Correção

Inicializar `identifier` com um valor padrão na declaração:

**Linha 201** de `server/src/baileys-manager.ts`:
```typescript
// De:
let identifier: string;

// Para:
let identifier: string = remoteJid.replace(/@.*$/, "");
```

Isso dá um valor padrão seguro (extrai o número do JID) que será sobrescrito pelos blocos de resolução LID quando aplicável. A linha 244 (`identifier = remoteJid.replace(/@.*$/, "")`) no `else` já faz exatamente isso, então o comportamento permanece idêntico.

Nenhuma outra alteração necessária.

