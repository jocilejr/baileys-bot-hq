

## Diagnóstico: QR Codes não funcionais e conexão Baileys falhando

### Problemas Identificados

1. **`useInstances` não faz polling automático** — Após criar a instância, o Baileys gera o QR code e salva no banco, mas o frontend nunca refaz a query para buscar o QR atualizado. O usuário precisa recarregar a página manualmente. QR codes do Baileys expiram em ~20 segundos e são regenerados múltiplas vezes, então o frontend precisa polling constante.

2. **QR Code com resolução baixa (300px)** — O `QRCode.toDataURL(qr, { width: 300 })` gera uma imagem de 300px que pode ser difícil de escanear dependendo da tela. WhatsApp recomenda pelo menos 400-500px.

3. **Diálogo do QR só aparece se `status === "qr_pending"`** — Quando o usuário cria a instância, o status começa como `disconnected`, e o QR demora alguns segundos para ser gerado. Sem polling, o botão de QR nunca aparece.

4. **Falta de Realtime/Subscription** — O ideal seria usar Supabase Realtime para receber updates da tabela `instances` instantaneamente quando o backend atualiza o QR code, em vez de depender de polling.

5. **Backend `server/.env` deve usar `http://localhost:8000`** — No `install.sh` (linha 375), o backend usa URL local para o Supabase. Se o usuário configurou com a URL externa (`https://supabase.app...`), pode ter problemas de latência ou CORS desnecessário.

### Plano de Correção

#### 1. Adicionar `refetchInterval` ao `useInstances`
No `src/hooks/useInstances.ts`, adicionar polling de 3 segundos para que o QR code apareça automaticamente:
```ts
refetchInterval: 3000
```

#### 2. Aumentar resolução do QR Code
No `server/src/baileys-manager.ts`, aumentar o tamanho e adicionar margem:
```ts
QRCode.toDataURL(qr, { width: 512, margin: 2, errorCorrectionLevel: 'M' })
```

#### 3. Melhorar UX do QR na página de Configurações
No `src/pages/Configuracoes.tsx`:
- Mostrar o QR automaticamente em um diálogo ao criar a instância (sem precisar clicar no botão)
- Mostrar indicador de "Aguardando QR..." quando status é `connecting`
- Mostrar o QR inline (sem diálogo) quando disponível, para facilitar o escaneamento
- Adicionar timer visual mostrando que o QR expira e será renovado

#### 4. Adicionar Supabase Realtime para updates instantâneos
Usar `supabase.channel('instances')` para escutar mudanças na tabela `instances` em tempo real, invalidando o cache do React Query quando o QR code muda.

#### 5. Corrigir `server/.env` na VPS
Confirmar que o backend usa `http://localhost:8000` (comunicação local) e não a URL externa.

### Detalhes Técnicos

**Arquivos modificados:**
- `src/hooks/useInstances.ts` — Adicionar refetchInterval + hook de realtime subscription
- `server/src/baileys-manager.ts` — Aumentar resolução do QR, adicionar error correction level
- `src/pages/Configuracoes.tsx` — UX melhorada: auto-abrir diálogo QR, estados intermediários, QR inline

**Arquivo novo:**
- Nenhum

