

# Plano: Forçar sync do install.sh para o GitHub

## Problema

O `install.sh` no Lovable está correto (versão com Supabase Self-Hosted), mas o GitHub ainda tem a versão antiga. O `curl` da VPS baixa a versão antiga do GitHub.

## Solução

Fazer uma edição mínima no `install.sh` (ex: adicionar um comentário com timestamp) para forçar o Lovable a fazer push para o GitHub. Depois disso, o `curl` ou `git pull` na VPS trará a versão correta.

## Mudança

### `install.sh`
- Adicionar comentário com versão/data no topo do arquivo para forçar o commit e push automático do Lovable para o GitHub

## Após implementação

Na VPS, rodar:
```bash
cd ~/baileys-bot-hq
git pull
# ou
curl -o install.sh https://raw.githubusercontent.com/jocilejr/baileys-bot-hq/main/install.sh
head -10 install.sh
# Deve mostrar "Supabase Self-Hosted + Baileys"
chmod +x install.sh
sudo ./install.sh
```

