

## Diagnóstico

Há **dois problemas** evidenciados na screenshot:

### 1. Contatos com números LID (ex: 201099109757160)
O mapeamento LID → telefone real não está funcionando porque no Baileys v6, o campo `lid` nos contatos pode vir com formato diferente (ex: `id` = `numero@lid` e não `numero@s.whatsapp.net`). O history sync pode não estar entregando os campos esperados.

### 2. Mensagens em tempo real não aparecem
O servidor **processa** as mensagens (os logs confirmam `processMessage` sendo chamado), mas o frontend não atualiza. Isso indica que o **Supabase Realtime** não está configurado no banco VPS — as tabelas `messages` e `conversations` precisam estar na publicação `supabase_realtime`.

---

## Solução

### Passo 1: Habilitar Realtime no banco VPS

Executar no banco PostgreSQL da VPS:

```bash
sudo docker exec -i supabase-db psql -U postgres -d postgres <<'SQL'
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE contacts;
SQL
```

### Passo 2: Melhorar debug de LID no `server/src/baileys-manager.ts`

No listener `messaging-history.set`, adicionar log detalhado dos primeiros contatos para entender o formato real dos dados:

```typescript
// Dentro de messaging-history.set, antes do loop de contacts
if (contacts && contacts.length > 0) {
  // Log first 3 contacts raw data for debugging
  for (let i = 0; i < Math.min(3, contacts.length); i++) {
    this.logger.info(`Contact sample ${i}: ${JSON.stringify(contacts[i])}`);
  }
}
```

### Passo 3: Adicionar polling como fallback no frontend

Em `src/hooks/useConversations.ts`, habilitar polling periódico **sempre** (não só quando realtime falha), como segurança:

- `useConversations`: `refetchInterval: 10000` (10s)
- `useMessages`: `refetchInterval: 5000` (5s)

Isso garante que mesmo se o Realtime não estiver configurado, as mensagens apareçam com um pequeno delay.

### Passo 4: Limpar contatos LID antigos

Após o deploy, o usuário deve:
1. Executar o SQL de limpeza dos contatos com `length(phone) > 15`
2. Desconectar e reconectar a instância para forçar re-sync com o mapeamento ativo
3. Verificar os logs de "Contact sample" para entender o formato real

---

## Resumo de alterações em código

| Arquivo | Alteração |
|---|---|
| `server/src/baileys-manager.ts` | Adicionar log de debug nos contatos do history sync |
| `src/hooks/useConversations.ts` | Habilitar polling sempre (10s conversas, 5s mensagens) |

