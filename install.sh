#!/bin/bash
set -e

echo "============================================"
echo "  ZapManager — Instalação Automática VPS"
echo "============================================"
echo ""

# Collect info
read -p "🌐 Domínio do frontend (ex: zapmanager.com): " DOMAIN
read -p "🔗 Subdomínio da API (ex: api.zapmanager.com): " API_DOMAIN
read -p "📧 Email para SSL (Let's Encrypt): " SSL_EMAIL
read -p "🔑 Supabase URL: " SUPABASE_URL
read -sp "🔑 Supabase Service Role Key: " SUPABASE_SERVICE_KEY
echo ""

APP_DIR="/opt/zapmanager"

echo ""
echo "📦 Instalando dependências do sistema..."
apt-get update -y
apt-get install -y curl git nginx certbot python3-certbot-nginx

# Node.js 20
if ! command -v node &> /dev/null; then
  echo "📦 Instalando Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# PM2
if ! command -v pm2 &> /dev/null; then
  echo "📦 Instalando PM2..."
  npm install -g pm2
fi

echo ""
echo "📂 Configurando aplicação em $APP_DIR..."
mkdir -p $APP_DIR

# Clone or pull
if [ -d "$APP_DIR/.git" ]; then
  cd $APP_DIR && git pull
else
  read -p "🔗 URL do repositório Git: " GIT_URL
  git clone "$GIT_URL" $APP_DIR
  cd $APP_DIR
fi

# Build frontend
echo ""
echo "🏗️ Construindo frontend..."
npm install
echo "VITE_API_URL=https://$API_DOMAIN/api" > .env.production
npm run build

# Setup server
echo ""
echo "🖥️ Configurando backend..."
cd $APP_DIR/server
cat > .env <<EOF
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY
PORT=3001
CORS_ORIGIN=https://$DOMAIN
EOF

npm install
npx tsc || true

# Nginx config
echo ""
echo "🔧 Configurando Nginx..."
cat > /etc/nginx/sites-available/zapmanager <<EOF
# Frontend
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    root $APP_DIR/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# API Backend
server {
    listen 80;
    server_name $API_DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

ln -sf /etc/nginx/sites-available/zapmanager /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# SSL
echo ""
echo "🔒 Configurando SSL..."
certbot --nginx -d "$DOMAIN" -d "$API_DOMAIN" --email "$SSL_EMAIL" --agree-tos --non-interactive --redirect || {
  echo "⚠️ SSL falhou. Verifique se os DNS apontam para este servidor."
  echo "   Rode manualmente: certbot --nginx -d $DOMAIN -d $API_DOMAIN"
}

# Setup admin
echo ""
echo "🔐 Criando conta de administrador..."
cd $APP_DIR/server
npx tsx src/setup-admin.ts

# Start with PM2
echo ""
echo "🚀 Iniciando backend com PM2..."
cd $APP_DIR
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -1 | bash || true

echo ""
echo "============================================"
echo "  ✅ Instalação concluída!"
echo "============================================"
echo ""
echo "  Frontend: https://$DOMAIN"
echo "  API:      https://$API_DOMAIN"
echo ""
echo "  Comandos úteis:"
echo "    pm2 logs zapmanager-api   — Ver logs"
echo "    pm2 restart zapmanager-api — Reiniciar API"
echo "    pm2 status                — Status dos processos"
echo ""
