

# Plano: Hardcodar URL do repositório Git no install.sh

O script atual (linha 165) pede interativamente a URL do repositório Git. Vou embutir a URL diretamente no script para que ele clone automaticamente sem perguntar.

## Mudança

### `install.sh` — Linhas 155-168

Substituir o bloco que pede `GIT_URL` por clone automático com a URL do repositório hardcodada:

```bash
# Clonar/atualizar aplicação
echo ""
echo "📂 Configurando aplicação em $APP_DIR..."
mkdir -p $APP_DIR

GIT_URL="https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git"

if [ -d "$APP_DIR/.git" ]; then
  cd $APP_DIR && git pull
else
  git clone "$GIT_URL" $APP_DIR
  cd $APP_DIR
fi
```

**Nota**: O projeto precisa estar conectado ao GitHub primeiro (Settings → GitHub no Lovable). Depois de conectado, eu substituo o placeholder pela URL real do repositório.

