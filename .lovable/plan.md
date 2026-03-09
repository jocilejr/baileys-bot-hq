

## Problema

O Baileys v6 usa identificadores `@lid` (Linked ID) para quase todas as mensagens privadas. O campo `msg.key.participant` é **null** em chats privados (só é preenchido em grupos), então a resolução atual via `participant` quase nunca funciona. Resultado:

1. Mensagens são salvas sob contatos com LID (ex: `80178499813629`) em vez do número real
2. O número real (+55 89 8134-0810) que envia mensagens não é reconhecido
3. Contatos duplicados e mensagens "perdidas"

## Solução

### 1. Criar mapa LID → Phone no backend (`server/src/baileys-manager.ts`)

- Adicionar um `Map<string, string>` (`lidMap`) na classe `BaileysManager` por instância
- Escutar os eventos `contacts.set` e `contacts.update` do Baileys que fornecem os contatos com o campo `id` (formato `@s.whatsapp.net`) e `lid` (formato `@lid`)
- Quando o socket do usuário conectar, popular `lidMap` com `lid_number → phone_number`
- Na `processMessage`, quando o JID for `@lid`, consultar o `lidMap` para obter o número real

### 2. Atualizar `processMessage` para usar o mapa

- Se `remoteJid` contém `@lid`:
  1. Extrair o LID number
  2. Buscar no `lidMap` → se encontrar, usar o phone real como `identifier`
  3. Se não encontrar no mapa, tentar `participant` (fallback atual)
  4. Se nada funcionar, usar LID como último fallback com log de warning

### 3. Limpeza de dados na VPS

Fornecer SQL para:
- Deletar contatos/conversas/mensagens com LID (phone > 15 chars)
- Após limpeza, re-escanear QR para forçar novo sync com o mapa ativo

### Detalhes técnicos

```text
BaileysManager:
  + lidMaps: Map<instanceId, Map<lidNumber, phoneNumber>>
  
  startSession():
    + socket.ev.on("contacts.set", contacts => { build lidMap })
    + socket.ev.on("contacts.update", contacts => { update lidMap })
    
  processMessage():
    if isLid:
      1. lidMap.get(lidNumber) → phoneNumber ✓
      2. participant fallback ✓  
      3. LID fallback + warning ✓
```

