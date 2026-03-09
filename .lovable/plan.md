

## Diagnóstico: Banco de dados separados

O problema é que o **frontend** e o **servidor backend (Baileys)** estão conectados a **bancos de dados diferentes**:

- **Frontend** (app.chatbotsimplificado.com): conecta ao Lovable Cloud (`lyslqcapgawzffivlgjh.supabase.co`)
- **Servidor Baileys** (api.chatbotsimplificado.com): provavelmente conecta ao Supabase self-hosted na VPS (`supabase.app.chatbotsimplificado.com`)

Quando o Baileys recebe mensagens do WhatsApp, ele grava no banco self-hosted. Mas o frontend lê do Lovable Cloud, que está vazio (0 conversas, 0 contatos, 0 instâncias).

## Solução

Você precisa alinhar o servidor para usar o **mesmo banco** que o frontend. Na VPS, edite o arquivo `/root/baileys-bot-hq/server/.env` e configure:

```bash
SUPABASE_URL=https://lyslqcapgawzffivlgjh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<sua_service_role_key_do_lovable_cloud>
```

Depois reinicie o servidor:
```bash
pm2 restart zapmanager-api
# ou systemctl restart zapmanager-api (dependendo de como está configurado)
```

### Como obter a Service Role Key

A Service Role Key do Lovable Cloud pode ser encontrada acessando o backend do projeto.

### Alternativa

Se você prefere usar o Supabase self-hosted como banco principal, a solução é atualizar o `.env` do **frontend** (no build) para apontar para `supabase.app.chatbotsimplificado.com`. Porém, isso desconecta do Lovable Cloud.

### Verificação

Após alinhar, rode na VPS:
```bash
cat /root/baileys-bot-hq/server/.env
```
E confirme que `SUPABASE_URL` aponta para `lyslqcapgawzffivlgjh.supabase.co`. Depois envie uma mensagem de teste pelo WhatsApp e verifique se aparece no chat.

