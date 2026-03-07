

# Plano: Forçar sincronização do install.sh com GitHub

## Problema

O `install.sh` no Lovable está **correto** (v2.0 com Supabase Self-Hosted), mas o GitHub não está recebendo a atualização. A VPS mostra a versão antiga com prompt `(ex: zapmanager.com)` ao invés de `(ex: app.chatbotsimplificado.com)`.

## Solução

Fazer uma alteração mais significativa no `install.sh` para forçar o push para o GitHub. Vou adicionar um bloco de comentário visível no início do arquivo e um `echo` extra para garantir que o Lovable detecte a mudança e sincronize.

## Mudanças

### `install.sh`
- Adicionar linha de versão/build timestamp mais explícita
- Adicionar `echo` com versão no início da execução para o usuário confirmar visualmente que está rodando a versão correta

## Após implementação

Na VPS:
```bash
cd ~/baileys-bot-hq
git pull
head -5 install.sh
# Deve mostrar "v2.0" e "Supabase Self-Hosted"
chmod +x install.sh
sudo ./install.sh
```

Se o `git pull` ainda não trouxer a versão nova, o problema é de sync do Lovable com o GitHub — nesse caso será necessário copiar o conteúdo manualmente.

