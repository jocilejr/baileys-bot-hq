

# ZapManager - Painel de Gestão WhatsApp

## Visão Geral
Painel web completo estilo BotConversa para gerenciar instâncias WhatsApp via Baileys, com multi-atendimento, automações, disparos em massa e gestão de contatos. O frontend será construído em React e se conectará à API do seu backend (Baileys) na VPS.

---

## 1. Autenticação e Controle de Acesso
- Tela de login com email/senha
- 3 roles: **Admin**, **Supervisor**, **Atendente**
- Admin: acesso total (instâncias, configurações, usuários)
- Supervisor: gerencia filas, vê relatórios, monitora atendentes
- Atendente: apenas atende conversas da sua fila
- Gerenciamento de usuários pelo admin

## 2. Dashboard Principal
- Resumo de métricas: conversas ativas, mensagens enviadas/recebidas, tempo médio de resposta
- Status das instâncias WhatsApp (conectado/desconectado)
- Gráficos com Recharts (volume de mensagens, atendimentos por período)

## 3. Gerenciamento de Instâncias WhatsApp
- Adicionar/remover instâncias (números WhatsApp)
- QR Code para conexão via Baileys
- Status em tempo real de cada instância
- Reconexão automática

## 4. Chat / Multi-Atendimento
- Interface de chat estilo WhatsApp (lista de conversas à esquerda, mensagens à direita)
- Filas e departamentos (Vendas, Suporte, Financeiro, etc.)
- Transferência de conversa entre atendentes
- Indicador de quem está atendendo cada conversa
- Envio de texto, imagens, documentos, áudio
- Respostas rápidas (templates salvos)
- Tags/etiquetas nos contatos

## 5. Contatos / CRM Básico
- Lista de contatos com busca e filtros
- Perfil do contato com histórico de conversas
- Tags e campos personalizados
- Importação/exportação de contatos (CSV)

## 6. Fluxos de Automação (Chatbot)
- Editor visual de fluxos (arrastar e soltar)
- Blocos: mensagem, pergunta, condição, delay, transferir para humano, webhook
- Gatilhos: palavra-chave, primeira mensagem, horário
- Ativar/desativar fluxos por instância

## 7. Disparos em Massa
- Criar campanhas com lista de destinatários
- Agendamento de envio
- Delay entre mensagens (para evitar ban)
- Relatório de entrega (enviado, entregue, lido)
- Templates com variáveis ({{nome}}, {{empresa}})

## 8. Configurações
- Horário de atendimento (respostas automáticas fora do horário)
- Mensagem de boas-vindas e ausência
- Webhooks para integrações externas
- Configuração da URL da API backend (Baileys)

## 9. Layout e Navegação
- Sidebar fixa com menu: Dashboard, Chat, Contatos, Automações, Disparos, Instâncias, Configurações
- Design moderno e responsivo com Tailwind CSS
- Tema escuro

## Nota Técnica
- O frontend será preparado com serviços/hooks que fazem chamadas HTTP para a API do seu backend na VPS
- Você precisará configurar o backend Node.js (Baileys + Express) separadamente — a estrutura de endpoints esperados será documentada
- Dados serão armazenados via Supabase (contatos, conversas, fluxos, usuários) com comunicação em tempo real via WebSocket para o chat

