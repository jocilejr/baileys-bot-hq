

## Problema

O Baileys v6 (`@whiskeysockets/baileys@6.7.17`) não tem o evento `"contacts.set"` no `BaileysEventMap`. Os contatos são entregues dentro do evento `"messaging-history.set"` no campo `contacts`.

## Alteração

### `server/src/baileys-manager.ts`

1. **Remover** o listener `socket.ev.on("contacts.set", ...)` (linhas 100-113) — esse evento não existe na v6.

2. **Mover a lógica de mapeamento LID** para dentro do listener `"messaging-history.set"` que já existe (linha ~260), extraindo contatos do payload:

```text
socket.ev.on("messaging-history.set", async ({ messages, contacts, isLatest }) => {
  // Build LID map from contacts
  if (contacts) {
    for (const c of contacts) {
      const cId = c.id;
      const cLid = (c as any).lid;
      if (cId && cLid) {
        const phone = cId.replace(/@.*$/, "");
        const lid = cLid.replace(/@.*$/, "");
        lidMap.set(lid, phone);
      }
    }
  }
  // ... process messages as before
});
```

3. **Manter** o listener `"contacts.update"` (linha 115) — esse evento existe na v6 e serve para atualizações incrementais.

Isso resolve o erro de compilação e permite o mapeamento LID funcionar corretamente.

