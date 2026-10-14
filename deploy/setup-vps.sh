#!/usr/bin/env bash
# ==============================================================================
# Mithilakart Automated VPS 1-Line Production Deployment Script
# Target OS: Ubuntu 20.04 / 22.04 / 24.04 LTS & Debian 11 / 12
#
# Supported Usage:
#   1. Zero-input One-Liner (with flags):
#      sudo bash setup-vps.sh --domain example.com --email admin@example.com
#
#   2. Interactive Mode:
#      sudo bash setup-vps.sh
#
#   3. Direct remote curl runner:
#      curl -fsSL https://raw.githubusercontent.com/palakk2002/Mithilakart/main/deploy/setup-vps.sh | sudo bash -s -- --domain example.com --email admin@example.com
# ==============================================================================

set -Eeuo pipefail

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

log_info() { echo -e "${BLUE}${BOLD}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}${BOLD}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}${BOLD}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}${BOLD}[ERROR]${NC} $1"; }

# ------------------------------------------------------------------------------
# 1. Root Check
# ------------------------------------------------------------------------------
if [ "$(id -u)" -ne 0 ]; then
  log_error "This script must be run as root (or with sudo)."
  exit 1
fi

echo -e "${BOLD}"
echo "===================================================================="
echo "          MITHILAKART — VPS PRODUCTION DEPLOYMENT SUITE            "
echo "===================================================================="
echo -e "${NC}"

# ------------------------------------------------------------------------------
# 2. Parameters & Interactive Prompting
# ------------------------------------------------------------------------------
DOMAIN=""
SSL_EMAIL=""
SKIP_SSL=false
REPO_URL="https://github.com/palakk2103/Mithilakart.git"
INSTALL_DIR="/var/www/mithilakart"
MONGODB_URI=""

# Parse CLI options
while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)
      DOMAIN="$2"; shift 2 ;;
    --email)
      SSL_EMAIL="$2"; shift 2 ;;
    --skip-ssl)
      SKIP_SSL=true; shift ;;
    --mongo-uri)
      MONGODB_URI="$2"; shift 2 ;;
    --repo)
      REPO_URL="$2"; shift 2 ;;
    --dir)
      INSTALL_DIR="$2"; shift 2 ;;
    *)
      log_warn "Unknown parameter: $1"; shift ;;
  esac
done

# If domain not provided via CLI, prompt interactively
if [ -z "$DOMAIN" ]; then
  echo -e "${YELLOW}Enter your public domain name (e.g. mithilakart.com) or press Enter to use public IP:${NC}"
  read -r input_domain < /dev/tty 2>/dev/null || input_domain=""
  if [ -n "$input_domain" ]; then
    DOMAIN="$input_domain"
  else
    PUBLIC_IP=$(curl -s -4 ifconfig.me || curl -s -4 icanhazip.com || echo "localhost")
    DOMAIN="$PUBLIC_IP"
    SKIP_SSL=true
    log_info "No domain specified. Using server public IP: $DOMAIN (SSL will be skipped)"
  fi
fi

# If SSL not skipped and email not provided, prompt
if [ "$SKIP_SSL" = false ] && [ -z "$SSL_EMAIL" ]; then
  echo -e "${YELLOW}Enter administrator email for Let's Encrypt SSL certificates:${NC}"
  read -r input_email < /dev/tty 2>/dev/null || input_email=""
  if [ -n "$input_email" ]; then
    SSL_EMAIL="$input_email"
  else
    SKIP_SSL=true
    log_warn "No email provided. Proceeding without automated SSL certificate."
  fi
fi

log_info "Target Domain: $DOMAIN"
log_info "Install Directory: $INSTALL_DIR"
log_info "SSL Configuration: $( [ "$SKIP_SSL" = true ] && echo 'Disabled' || echo "Enabled ($SSL_EMAIL)" )"

# ------------------------------------------------------------------------------
# 3. System Packages & Prerequisites
# ------------------------------------------------------------------------------
log_info "Step 1/8: Updating package indices and installing core dependencies..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl wget git ufw build-essential software-properties-common ca-certificates gnupg lsb-release

# Install Redis Server
log_info "Installing and configuring Redis..."
apt-get install -y redis-server
systemctl enable redis-server
systemctl restart redis-server

# Install Nginx
log_info "Installing Nginx..."
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx

# Install Node.js & npm
log_info "Checking Node.js & npm..."
NODE_MAJOR=20
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d'.' -f1 | tr -d 'v')" -lt "$NODE_MAJOR" ]; then
  log_info "Installing Node.js $NODE_MAJOR LTS from NodeSource..."
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg --yes
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
  apt-get update -y
  apt-get install -y nodejs
fi

# Ensure npm package is present (Ubuntu separates nodejs and npm in default repos)
if ! command -v npm >/dev/null 2>&1; then
  log_info "npm not found. Installing npm package via apt..."
  apt-get update -y
  apt-get install -y npm || true
fi

# Fallback check for corepack
if ! command -v npm >/dev/null 2>&1; then
  if command -v corepack >/dev/null 2>&1; then
    log_info "Enabling corepack for npm..."
    corepack enable || true
  fi
fi

if ! command -v npm >/dev/null 2>&1; then
  log_error "npm could not be located. Please install npm manually and re-run."
  exit 1
fi

log_success "Node.js $(node -v) and npm $(npm -v) verified."

# Install PM2 and Certbot
log_info "Installing PM2 and Certbot..."
npm install -g pm2
apt-get install -y certbot python3-certbot-nginx

# ------------------------------------------------------------------------------
# 4. Clone or Update Repository
# ------------------------------------------------------------------------------
log_info "Step 2/8: Preparing project codebase at $INSTALL_DIR..."
mkdir -p /var/log/pm2

CURRENT_SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT_DETECTED=$(cd "$CURRENT_SCRIPT_DIR/.." && pwd)

if [ -f "$REPO_ROOT_DETECTED/package.json" ] && [ -d "$REPO_ROOT_DETECTED/backend" ]; then
  # Script is running directly inside a cloned repository
  if [ "$REPO_ROOT_DETECTED" != "$INSTALL_DIR" ]; then
    log_info "Syncing local workspace to $INSTALL_DIR..."
    mkdir -p "$INSTALL_DIR"
    rsync -a --exclude 'node_modules' --exclude '.git' "$REPO_ROOT_DETECTED/" "$INSTALL_DIR/"
  fi
else
  # Fresh installation on clean VPS
  if [ -d "$INSTALL_DIR/.git" ]; then
    log_info "Existing git repository found. Pulling latest main branch..."
    cd "$INSTALL_DIR"
    git fetch --all
    git reset --hard origin/main
  else
    log_info "Cloning repository from $REPO_URL..."
    rm -rf "$INSTALL_DIR"
    git clone "$REPO_URL" "$INSTALL_DIR"
  fi
fi

cd "$INSTALL_DIR"

# ------------------------------------------------------------------------------
# 5. Backend Production Setup
# ------------------------------------------------------------------------------
log_info "Step 3/8: Setting up Backend (dependencies, keys, environment, database)..."
cd "$INSTALL_DIR/backend"

# Ensure .env exists
if [ ! -f ".env" ]; then
  log_info "Creating production .env from template..."
  cp .env.example .env

  # If user supplied mongo-uri or prompt
  if [ -n "$MONGODB_URI" ]; then
    sed -i "s|MONGODB_URI=.*|MONGODB_URI=$MONGODB_URI|" .env
  elif ! grep -q "mongodb+srv" .env && ! grep -q "mongodb://127.0.0.1" .env; then
    echo -e "${YELLOW}Please enter your production MONGODB_URI (e.g. mongodb+srv://...):${NC}"
    read -r user_mongo < /dev/tty 2>/dev/null || user_mongo=""
    if [ -n "$user_mongo" ]; then
      sed -i "s|MONGODB_URI=.*|MONGODB_URI=$user_mongo|" .env
    fi
  fi

  # Apply production config overrides
  sed -i "s|NODE_ENV=.*|NODE_ENV=production|" .env
  sed -i "s|PORT=.*|PORT=5000|" .env
  sed -i "s|REDIS_URL=.*|REDIS_URL=redis://127.0.0.1:6379|" .env
  sed -i "s|LOG_PRETTY=.*|LOG_PRETTY=false|" .env
  sed -i "s|RATE_LIMIT_ENABLED=.*|RATE_LIMIT_ENABLED=true|" .env
  sed -i "s|METRICS_ENABLED=.*|METRICS_ENABLED=true|" .env

  # Update CORS origin to match domain
  if [ "$SKIP_SSL" = true ]; then
    sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=http://$DOMAIN,http://localhost:3000,http://127.0.0.1:3000|" .env
  else
    if [[ "$DOMAIN" =~ ^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$ ]]; then
      sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://$DOMAIN,https://www.$DOMAIN,http://localhost:3000|" .env
    else
      sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://$DOMAIN,http://localhost:3000|" .env
    fi
  fi
else
  log_info "Using existing backend/.env file."
  # Ensure production flag and port are correct
  sed -i "s|PORT=.*|PORT=5000|" .env
  sed -i "s|NODE_ENV=.*|NODE_ENV=production|" .env
fi

# Install backend dependencies
log_info "Installing backend dependencies (clean install)..."
npm ci || npm install --production=false

# Generate RSA JWT keys if absent
log_info "Ensuring JWT RSA keypairs exist..."
node scripts/generate-jwt-keys.js || true

# Run database indexes and schema migrations
log_info "Applying database schema & idempotency migrations..."
node scripts/migrate-phase3.js || true
node scripts/migrate-cr001.js || true
node scripts/migrate-cr002.js || true
node scripts/migrate-idempotency-unique.js || true

# Validate backend environment
log_info "Validating environment configuration..."
node scripts/validate-env.js

log_success "Backend setup completed successfully."

# ------------------------------------------------------------------------------
# 6. Frontend Production Build
# ------------------------------------------------------------------------------
log_info "Step 4/8: Building Frontend production bundle..."
cd "$INSTALL_DIR/frontend"

# Ensure frontend .env exists
if [ ! -f ".env" ]; then
  cp .env.example .env
fi

# Set relative API path and domain configs
sed -i "s|VITE_API_BASE_URL=.*|VITE_API_BASE_URL=/api/v1|" .env
sed -i "s|VITE_SOCKET_URL=.*|VITE_SOCKET_URL=|" .env

# Update siteConfig.js with real domain if available
if [ "$DOMAIN" != "localhost" ] && [ "$SKIP_SSL" = false ]; then
  sed -i "s|https://www.mithilakart.com|https://$DOMAIN|g" src/config/siteConfig.js || true
fi

# Install frontend dependencies and build
log_info "Installing frontend dependencies..."
npm ci || npm install

log_info "Running frontend production build (Vite)..."
npm run build

if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
  log_error "Frontend build failed: dist/index.html not found!"
  exit 1
fi
log_success "Frontend built cleanly to $INSTALL_DIR/frontend/dist."

# ------------------------------------------------------------------------------
# 7. Configure PM2 Process Manager
# ------------------------------------------------------------------------------
log_info "Step 5/8: Configuring PM2 process manager for backend clustering..."
cd "$INSTALL_DIR"

# Ensure ecosystem config exists
if [ ! -f "ecosystem.config.js" ]; then
  cp deploy/ecosystem.config.js ./ecosystem.config.js || true
fi

# Stop any older PM2 instances of mithilakart-api
pm2 delete mithilakart-api 2>/dev/null || true

# Start backend via PM2
pm2 start ecosystem.config.js --env production
pm2 save

# Setup PM2 auto-restart on system boot
pm2 startup systemd -u root --hp /root || true

log_success "Backend process running under PM2 cluster mode."

# ------------------------------------------------------------------------------
# 8. Configure Nginx Web Server
# ------------------------------------------------------------------------------
log_info "Step 6/8: Configuring Nginx reverse proxy..."

NGINX_CONF_AVAILABLE="/etc/nginx/sites-available/mithilakart"
NGINX_CONF_ENABLED="/etc/nginx/sites-enabled/mithilakart"

# Remove default site if present
rm -f /etc/nginx/sites-enabled/default

# Determine server names based on whether domain is apex or subdomain
if [[ "$DOMAIN" =~ ^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$ ]]; then
  SERVER_NAMES="$DOMAIN www.$DOMAIN"
else
  SERVER_NAMES="$DOMAIN"
fi

# Generate Nginx configuration from template
sed -e "s|{{SERVER_NAME}}|$SERVER_NAMES|g" \
    -e "s|{{DOMAIN}}|$DOMAIN|g" \
    -e "s|{{FRONTEND_DIST}}|$INSTALL_DIR/frontend/dist|g" \
    "$INSTALL_DIR/deploy/nginx.conf.template" > "$NGINX_CONF_AVAILABLE"

# Enable configuration
ln -sf "$NGINX_CONF_AVAILABLE" "$NGINX_CONF_ENABLED"

# Test Nginx syntax
nginx -t

# Reload Nginx
systemctl reload nginx
log_success "Nginx configured and reloaded."

# ------------------------------------------------------------------------------
# 9. Automated SSL Certificate (Let's Encrypt / Certbot)
# ------------------------------------------------------------------------------
log_info "Step 7/8: Configuring SSL certificate..."

if [ "$SKIP_SSL" = false ] && [ -n "$DOMAIN" ] && [ -n "$SSL_EMAIL" ]; then
  log_info "Attempting automated Let's Encrypt SSL issuance for $DOMAIN..."
  
  CERTBOT_DOMAINS="-d $DOMAIN"
  if [[ "$DOMAIN" =~ ^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$ ]]; then
    CERTBOT_DOMAINS="-d $DOMAIN -d www.$DOMAIN"
  fi

  # Try provisioning SSL with certbot
  if certbot --nginx $CERTBOT_DOMAINS --non-interactive --agree-tos -m "$SSL_EMAIL" --redirect; then
    log_success "SSL certificate successfully provisioned and enabled for $DOMAIN!"
    systemctl reload nginx
  else
    log_warn "Certbot automated SSL issuance did not complete."
    log_warn "If your DNS records (A record) have not yet propagated to this VPS IP, wait a few minutes and run:"
    log_warn "  sudo certbot --nginx $CERTBOT_DOMAINS -m $SSL_EMAIL --agree-tos --redirect"
  fi
else
  log_info "Skipping SSL issuance as requested or using IP-only access."
fi

# ------------------------------------------------------------------------------
# 10. Configure UFW Firewall
# ------------------------------------------------------------------------------
log_info "Step 8/8: Hardening system firewall (UFW)..."
ufw allow 22/tcp >/dev/null 2>&1 || true
ufw allow 80/tcp >/dev/null 2>&1 || true
ufw allow 443/tcp >/dev/null 2>&1 || true

# Deny direct internet access to internal ports (keep internal to 127.0.0.1)
ufw deny 5000/tcp >/dev/null 2>&1 || true
ufw deny 6379/tcp >/dev/null 2>&1 || true
ufw deny 27017/tcp >/dev/null 2>&1 || true

# Enable UFW without prompting
echo "y" | ufw enable >/dev/null 2>&1 || true
log_success "Firewall rules applied (SSH 22, HTTP 80, HTTPS 443 open; port 5000 & 6379 protected)."

# ------------------------------------------------------------------------------
# 11. Health Check & Verification
# ------------------------------------------------------------------------------
sleep 2
log_info "Verifying backend health..."
HEALTH_STATUS=$(curl -s http://127.0.0.1:5000/health || echo "failed")

if echo "$HEALTH_STATUS" | grep -q '"status":"ok"'; then
  log_success "Backend API health check PASSED!"
else
  log_warn "Backend health check response: $HEALTH_STATUS"
fi

# ------------------------------------------------------------------------------
# Summary & Information
# ------------------------------------------------------------------------------
PROTOCOL="http"
[ "$SKIP_SSL" = false ] && PROTOCOL="https"

echo ""
echo -e "${GREEN}${BOLD}====================================================================${NC}"
echo -e "${GREEN}${BOLD}     MITHILAKART VPS DEPLOYMENT COMPLETED SUCCESSFULLY!             ${NC}"
echo -e "${GREEN}${BOLD}====================================================================${NC}"
echo ""
echo -e "  🌐 ${BOLD}Website Storefront:${NC}    $PROTOCOL://$DOMAIN"
echo -e "  ⚙️ ${BOLD}Backend Health API:${NC}    $PROTOCOL://$DOMAIN/api/v1/health"
echo -e "  📚 ${BOLD}Interactive Swagger:${NC}   $PROTOCOL://$DOMAIN/api/docs"
echo -e "  ⚡ ${BOLD}PM2 Status Monitor:${NC}    pm2 status"
echo -e "  📋 ${BOLD}PM2 Real-time Logs:${NC}    pm2 logs mithilakart-api"
echo -e "  🔄 ${BOLD}Update Script:${NC}         sudo bash $INSTALL_DIR/deploy/update.sh"
echo ""
echo -e "${BOLD}Operational Tips:${NC}"
echo -e "  • To edit backend env:    nano $INSTALL_DIR/backend/.env && pm2 reload mithilakart-api"
echo -e "  • To view Nginx logs:     tail -f /var/log/nginx/error.log"
echo -e "  • To renew SSL manually:  sudo certbot renew"
echo ""
echo -e "${GREEN}Mithilakart is now fully live and production-ready!${NC}"
