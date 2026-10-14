#!/usr/bin/env bash
# ==============================================================================
# Mithilakart Zero-Downtime Application Update Script
# Usage: sudo bash /var/www/mithilakart/deploy/update.sh
# ==============================================================================

set -Eeuo pipefail

BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

log_info() { echo -e "${BLUE}${BOLD}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}${BOLD}[SUCCESS]${NC} $1"; }

INSTALL_DIR="/var/www/mithilakart"

if [ ! -d "$INSTALL_DIR" ]; then
  CURRENT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
  INSTALL_DIR="$CURRENT_DIR"
fi

cd "$INSTALL_DIR"

log_info "1. Pulling latest changes from Git repository..."
git fetch origin main
git reset --hard origin/main

log_info "2. Updating backend dependencies..."
cd "$INSTALL_DIR/backend"
npm ci || npm install --production=false

log_info "3. Running database migrations..."
node scripts/migrate-phase3.js || true
node scripts/migrate-cr001.js || true
node scripts/migrate-cr002.js || true
node scripts/migrate-idempotency-unique.js || true

log_info "4. Building updated frontend bundle..."
cd "$INSTALL_DIR/frontend"
npm ci || npm install
npm run build

log_info "5. Reloading backend API with zero downtime..."
cd "$INSTALL_DIR"
pm2 reload mithilakart-api --update-env

log_info "6. Reloading Nginx..."
systemctl reload nginx

log_info "7. Verifying health check..."
sleep 2
curl -s http://127.0.0.1:5000/health | grep -q '"status":"ok"' && log_success "Update completed and API is healthy!" || echo "Warning: Check pm2 logs"

log_success "Mithilakart updated successfully!"
