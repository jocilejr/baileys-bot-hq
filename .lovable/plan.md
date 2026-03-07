

# Plano: Nova abordagem para sincronizar o instalador

## Diagnóstico

O `install.sh` no Lovable está correto (v2.0.1), mas o sync do Lovable para o GitHub **não está detectando as mudanças neste arquivo**. O `git pull` só trouxe `.lovable/plan.md`. Isso indica que o Lovable pode ter um cache ou snapshot antigo do `install.sh` e não reconhece que ele mudou.

## Nova Abordagem

Em vez de editar o `install.sh` existente (que claramente não está sendo sincronizado), vou:

1. **Deletar o `install.sh` atual** e **recriar do zero** com um nome/conteúdo completo usando `write_file` — isso força o Lovable a tratar como arquivo novo e incluir no próximo commit/push.

2. Se isso ainda não funcionar, **criar um arquivo alternativo** como `deploy.sh` com todo o conteúdo correto, que será um arquivo 100% novo e garantidamente sincronizado.

## Mudanças

### Deletar e recriar `install.sh`
- Usar `write_file` para sobrescrever completamente o arquivo com o conteúdo correto (v2.0.1 Supabase Self-Hosted)
- Todo o conteúdo será escrito de uma vez, sem edições parciais

### Plano B: `deploy.sh` (se install.sh continuar sem sync)
- Criar arquivo novo `deploy.sh` com conteúdo idêntico
- Na VPS: `chmod +x deploy.sh && sudo ./deploy.sh`

## Após implementação

```bash
cd ~/baileys-bot-hq
git pull
ls -la install.sh deploy.sh  # ver qual existe
head -5 install.sh            # confirmar versão
```

