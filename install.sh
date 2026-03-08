#!/bin/bash
set -e

echo "============================================"
echo "  ZapManager — Instalação 100% Autônoma"
echo "============================================"
echo ""

# ==================
# COLLECT INFO
# ==================

read -p "🌐 Domínio do frontend (ex: zapmanager.com): " DOMAIN
read -p "🔗 Subdomínio da API (ex: api.zapmanager.com): " API_DOMAIN
read -p "📧 Email para SSL (Let's Encrypt): " SSL_EMAIL
read -p "👤 Email do admin: " ADMIN_EMAIL
read -sp "🔑 Senha do admin (min 6 chars): " ADMIN_PASSWORD
echo ""

if [ ${#ADMIN_PASSWORD} -lt 6 ]; then
  echo "❌ Senha deve ter no mínimo 6 caracteres"
  exit 1
fi

APP_DIR="/opt/zapmanager"
SUPABASE_DIR="/opt/supabase"
SUPABASE_DOMAIN="supabase.${DOMAIN}"

# ==================
# 1. SYSTEM DEPENDENCIES
# ==================

echo ""
echo "📦 [1/11] Instalando dependências do sistema..."
apt-get update -y
apt-get install -y curl git nginx certbot python3-certbot-nginx ca-certificates gnupg lsb-release jq

# Docker
if ! command -v docker &> /dev/null; then
  echo "📦 Instalando Docker..."
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi

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

# ==================
# 2. CLONE REPOSITORY
# ==================

echo ""
echo "📂 [2/11] Configurando aplicação em $APP_DIR..."
mkdir -p $APP_DIR

if [ -d "$APP_DIR/.git" ]; then
  cd $APP_DIR && git pull
else
  read -p "🔗 URL do repositório Git: " GIT_URL
  git clone "$GIT_URL" $APP_DIR
  cd $APP_DIR
fi

# ==================
# 3. SUPABASE SELF-HOSTED
# ==================

echo ""
echo "🐘 [3/11] Instalando Supabase self-hosted..."

# Clone supabase docker setup
if [ ! -d "$SUPABASE_DIR" ]; then
  git clone --depth 1 https://github.com/supabase/supabase.git $SUPABASE_DIR
fi

cd $SUPABASE_DIR/docker

# Generate all secrets automatically
POSTGRES_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
SECRET_KEY_BASE=$(openssl rand -base64 48 | tr -d '\n')
VAULT_ENC_KEY=$(openssl rand -hex 16)
PG_META_CRYPTO_KEY=$(openssl rand -hex 16)
LOGFLARE_PUBLIC_ACCESS_TOKEN=$(openssl rand -hex 32)
LOGFLARE_PRIVATE_ACCESS_TOKEN=$(openssl rand -hex 32)
S3_ACCESS_KEY_ID=$(openssl rand -hex 16)
S3_ACCESS_KEY_SECRET=$(openssl rand -hex 32)
DASHBOARD_USERNAME="supabase"
DASHBOARD_PASSWORD=$(openssl rand -hex 12)

# Generate ANON_KEY
ANON_KEY=$(node -e "
  const crypto = require('crypto');
  const header = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    role:'anon',
    iss:'supabase',
    iat:Math.floor(Date.now()/1000),
    exp:Math.floor(Date.now()/1000)+315360000
  })).toString('base64url');
  const sig = crypto.createHmac('sha256','$JWT_SECRET').update(header+'.'+payload).digest('base64url');
  console.log(header+'.'+payload+'.'+sig);
")

# Generate SERVICE_ROLE_KEY
SERVICE_ROLE_KEY=$(node -e "
  const crypto = require('crypto');
  const header = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    role:'service_role',
    iss:'supabase',
    iat:Math.floor(Date.now()/1000),
    exp:Math.floor(Date.now()/1000)+315360000
  })).toString('base64url');
  const sig = crypto.createHmac('sha256','$JWT_SECRET').update(header+'.'+payload).digest('base64url');
  console.log(header+'.'+payload+'.'+sig);
")

echo "  ✅ Chaves geradas automaticamente"

# Write the .env file with ALL required values for Supabase Docker
cat > .env <<ENVEOF
############
# Secrets — auto-generated
############
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
JWT_SECRET=$JWT_SECRET
ANON_KEY=$ANON_KEY
SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
DASHBOARD_USERNAME=$DASHBOARD_USERNAME
DASHBOARD_PASSWORD=$DASHBOARD_PASSWORD
SECRET_KEY_BASE=$SECRET_KEY_BASE
VAULT_ENC_KEY=$VAULT_ENC_KEY
PG_META_CRYPTO_KEY=$PG_META_CRYPTO_KEY

############
# Database
############
POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432

############
# Kong API Gateway
############
KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

############
# API / URLs
############
SITE_URL=https://$DOMAIN
API_EXTERNAL_URL=https://$SUPABASE_DOMAIN
SUPABASE_PUBLIC_URL=https://$SUPABASE_DOMAIN
ADDITIONAL_REDIRECT_URLS=

############
# Auth (GoTrue)
############
JWT_EXPIRY=3600
DISABLE_SIGNUP=false
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=true
ENABLE_PHONE_SIGNUP=false
ENABLE_PHONE_AUTOCONFIRM=false
ENABLE_ANONYMOUS_USERS=false
SMTP_ADMIN_EMAIL=noreply@$DOMAIN
SMTP_HOST=supabase-mail
SMTP_PORT=2500
SMTP_USER=fake_mail_user
SMTP_PASS=fake_mail_password
SMTP_SENDER_NAME=ZapManager
MAILER_URLPATHS_INVITE=/auth/v1/verify
MAILER_URLPATHS_CONFIRMATION=/auth/v1/verify
MAILER_URLPATHS_RECOVERY=/auth/v1/verify
MAILER_URLPATHS_EMAIL_CHANGE=/auth/v1/verify

############
# Studio
############
STUDIO_DEFAULT_ORGANIZATION=ZapManager
STUDIO_DEFAULT_PROJECT=ZapManager
STUDIO_PORT=3000

############
# PostgREST
############
PGRST_DB_SCHEMAS=public,storage,graphql_public

############
# Functions
############
FUNCTIONS_VERIFY_JWT=false

############
# Logs / Analytics
############
LOGFLARE_API_KEY=fake-key-not-used
LOGFLARE_PUBLIC_ACCESS_TOKEN=$LOGFLARE_PUBLIC_ACCESS_TOKEN
LOGFLARE_PRIVATE_ACCESS_TOKEN=$LOGFLARE_PRIVATE_ACCESS_TOKEN

############
# Storage
############
STORAGE_TENANT_ID=stub
GLOBAL_S3_BUCKET=stub
REGION=stub
S3_PROTOCOL_ACCESS_KEY_ID=$S3_ACCESS_KEY_ID
S3_PROTOCOL_ACCESS_KEY_SECRET=$S3_ACCESS_KEY_SECRET
IMGPROXY_ENABLE_WEBP_DETECTION=true

############
# Pooler (Supavisor)
############
POOLER_PROXY_PORT_TRANSACTION=6543
POOLER_DEFAULT_POOL_SIZE=20
POOLER_MAX_CLIENT_CONN=100
POOLER_TENANT_ID=zapmanager
POOLER_DB_POOL_SIZE=5

############
# Docker / Vector
############
DOCKER_SOCKET_LOCATION=/var/run/docker.sock
ENVEOF

# Fix analytics blocking issue: change service_healthy to service_started
if [ -f "docker-compose.yml" ]; then
  sed -i 's/condition: service_healthy/condition: service_started/g' docker-compose.yml
fi

# Clean start — remove old volumes to avoid password mismatch
docker compose down -v 2>/dev/null || true

echo "  🚀 Iniciando containers Supabase..."
docker compose up -d

# Wait for database to be ready
echo "  ⏳ Aguardando banco de dados..."
MAX_RETRIES=60
RETRY=0
until docker compose exec -T db pg_isready -U postgres > /dev/null 2>&1; do
  RETRY=$((RETRY+1))
  if [ $RETRY -ge $MAX_RETRIES ]; then
    echo "  ❌ Banco de dados não ficou pronto em ${MAX_RETRIES}s"
    echo "  Verifique com: cd $SUPABASE_DIR/docker && docker compose logs db"
    exit 1
  fi
  sleep 1
done
echo "  ✅ Banco de dados pronto"

# Wait for auth service
echo "  ⏳ Aguardando serviço de autenticação..."
RETRY=0
until docker compose exec -T kong curl -sf http://auth:9999/health > /dev/null 2>&1; do
  RETRY=$((RETRY+1))
  if [ $RETRY -ge $MAX_RETRIES ]; then
    echo "  ⚠️ Auth service demorou, mas continuando..."
    break
  fi
  sleep 2
done

# Wait for REST service (PostgREST)
echo "  ⏳ Aguardando API REST..."
RETRY=0
until curl -sf http://localhost:8000/rest/v1/ -H "apikey: $ANON_KEY" > /dev/null 2>&1; do
  RETRY=$((RETRY+1))
  if [ $RETRY -ge 30 ]; then
    echo "  ⚠️ REST API demorou, mas continuando..."
    break
  fi
  sleep 2
done

echo "  ✅ Supabase self-hosted rodando"

# ==================
# 4. RUN MIGRATIONS
# ==================

echo ""
echo "🗃️ [4/11] Executando migrations..."

cd $APP_DIR
docker compose -f $SUPABASE_DIR/docker/docker-compose.yml exec -T db \
  psql -U postgres -d postgres < migrations/init.sql

echo "  ✅ Migrations executadas com sucesso"

# ==================
# 5. FRONTEND .env
# ==================

echo ""
echo "⚙️ [5/11] Configurando frontend..."

cd $APP_DIR
cat > .env.production <<FEEOF
VITE_SUPABASE_URL=https://$SUPABASE_DOMAIN
VITE_SUPABASE_PUBLISHABLE_KEY=$ANON_KEY
VITE_SUPABASE_PROJECT_ID=self-hosted
VITE_API_URL=https://$API_DOMAIN/api
FEEOF

# ==================
# 6. BUILD FRONTEND
# ==================

echo ""
echo "🏗️ [6/11] Construindo frontend..."

cd $APP_DIR
npm install
npm run build

echo "  ✅ Frontend construído"

# ==================
# 7. BACKEND CONFIG
# ==================

echo ""
echo "🖥️ [7/11] Configurando backend..."

cd $APP_DIR/server
cat > .env <<BEEOF
SUPABASE_URL=http://localhost:8000
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
PORT=3001
CORS_ORIGIN=https://$DOMAIN
BEEOF

npm install

# ==================
# 8. BUILD BACKEND
# ==================

echo ""
echo "🔨 [8/11] Construindo backend..."

cd $APP_DIR/server
npx tsc

echo "  ✅ Backend construído"

# ==================
# 9. CREATE ADMIN
# ==================

echo ""
echo "🔐 [9/11] Criando conta de administrador..."

cd $APP_DIR/server
ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" npx tsx src/setup-admin.ts

echo "  ✅ Admin criado"

# ==================
# 10. NGINX
# ==================

echo ""
echo "🔧 [10/11] Configurando Nginx..."

cat > /etc/nginx/sites-available/zapmanager <<NGINXEOF
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

# API Backend (Baileys)
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

# Supabase API (Kong)
server {
    listen 80;
    server_name $SUPABASE_DOMAIN;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/zapmanager /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# SSL
echo ""
echo "🔒 [11/11] Configurando SSL..."
certbot --nginx \
  -d "$DOMAIN" \
  -d "$API_DOMAIN" \
  -d "$SUPABASE_DOMAIN" \
  --email "$SSL_EMAIL" \
  --agree-tos --non-interactive --redirect || {
  echo "⚠️ SSL falhou. Verifique se os DNS apontam para este servidor."
  echo "   Domínios necessários: $DOMAIN, $API_DOMAIN, $SUPABASE_DOMAIN"
  echo "   Rode manualmente: certbot --nginx -d $DOMAIN -d $API_DOMAIN -d $SUPABASE_DOMAIN"
}

# ==================
# PM2 START
# ==================

echo ""
echo "🚀 Iniciando backend com PM2..."
cd $APP_DIR
mkdir -p logs
pm2 delete zapmanager-api 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -1 | bash || true

# ==================
# SUMMARY
# ==================

echo ""
echo "============================================"
echo "  ✅ Instalação concluída com sucesso!"
echo "============================================"
echo ""
echo "  🌐 Frontend:  https://$DOMAIN"
echo "  🔗 API:       https://$API_DOMAIN"
echo "  🐘 Supabase:  https://$SUPABASE_DOMAIN"
echo ""
echo "  👤 Admin:     $ADMIN_EMAIL"
echo ""
echo "  📋 Credenciais do Supabase (salve!):"
echo "     ANON_KEY:         $ANON_KEY"
echo "     SERVICE_ROLE_KEY: $SERVICE_ROLE_KEY"
echo "     POSTGRES_PASS:    $POSTGRES_PASSWORD"
echo "     JWT_SECRET:       $JWT_SECRET"
echo ""
echo "  📁 Arquivos importantes:"
echo "     Frontend:    $APP_DIR/dist"
echo "     Backend:     $APP_DIR/server"
echo "     Supabase:    $SUPABASE_DIR/docker"
echo "     Logs:        $APP_DIR/logs"
echo ""
echo "  🛠️ Comandos úteis:"
echo "     pm2 logs zapmanager-api    — Logs do backend"
echo "     pm2 restart zapmanager-api — Reiniciar backend"
echo "     cd $SUPABASE_DIR/docker && docker compose logs -f  — Logs Supabase"
echo "     cd $SUPABASE_DIR/docker && docker compose restart  — Reiniciar Supabase"
echo ""
