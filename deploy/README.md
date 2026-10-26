# 🚀 Mithilakart — 1-Line VPS Deployment Guide

This guide enables you to deploy the entire Mithilakart platform (Frontend, Backend API, Redis, Socket.IO WebSockets, Nginx Reverse Proxy, and Let's Encrypt SSL) to any Ubuntu/Debian VPS with **a single command**.

---

## ⚡ Quick Start: 1-Line Deployment

Access your VPS terminal via SSH:
```bash
ssh root@YOUR_SERVER_IP
```

Then run this **single command**:

```bash
curl -fsSL https://raw.githubusercontent.com/palakk2002/Mithilakart/main/deploy/setup-vps.sh | sudo bash -s -- --domain yourdomain.com --email admin@yourdomain.com
```

> **Replace** `yourdomain.com` with your real domain, and `admin@yourdomain.com` with your email.
> 
> If you don't have a domain yet and want to deploy directly to the server's public IP address (HTTP), simply run:
> ```bash
> curl -fsSL https://raw.githubusercontent.com/palakk2002/Mithilakart/main/deploy/setup-vps.sh | sudo bash
> ```

---

## 🛠️ What the Script Does Automatically

1. **System Provisioning:**
   - Installs Node.js 20 LTS, npm, Git, curl, ufw, build tools.
   - Installs, configures, and starts **Redis Server** (`redis-server`).
   - Installs **Nginx** and **Certbot** (Let's Encrypt SSL).
   - Installs **PM2** process manager globally.

2. **Backend Configuration:**
   - Installs production backend dependencies.
   - Configures `/var/www/mithilakart/backend/.env` with production flags.
   - Generates RSA JWT private/public key pairs for all 4 portals (`customer`, `seller`, `admin`, `delivery`).
   - Applies database schema migrations and idempotency unique indexes.
   - Starts the API cluster via PM2 with memory management and log rotation.
   - Registers PM2 with `systemd` so the API automatically starts on VPS reboot.

3. **Frontend Production Build:**
   - Installs dependencies and runs Vite production build (`dist/`).
   - Automatically generates `robots.txt` and `sitemap.xml`.

4. **Nginx & Reverse Proxy Setup:**
   - Serves frontend static SPA with gzip compression, caching, and HTML5 history fallback (`try_files $uri $uri/ /index.html`).
   - Proxies `/api/v1` to `http://127.0.0.1:5000`.
   - Proxies `/socket.io` for real-time WebSocket communication.
   - Proxies media uploads `/uploads/`.

5. **SSL Certificate Issuance:**
   - Acquires and installs a valid Let's Encrypt SSL certificate.
   - Enables automatic HTTPS redirection.
   - Configures automated certificate auto-renewal.

6. **Security & Firewall (UFW):**
   - Opens Port 22 (SSH), Port 80 (HTTP), Port 443 (HTTPS).
   - Blocks external access to internal ports (5000, 6379, 27017).

---

## 📋 What to Prepare Before Running

1. **DNS Records (Point Domain to VPS IP):**
   - Create an **A Record** pointing `yourdomain.com` to your VPS IP address.
   - (Optional) Create a **CNAME** or **A Record** for `www.yourdomain.com` pointing to your VPS IP.
   - *Note: DNS changes can take 5–15 minutes to propagate.*

2. **MongoDB Database:**
   - The script will ask for your `MONGODB_URI` (e.g. MongoDB Atlas cluster string) if not already set.
   - Ensure your MongoDB Atlas Network Access whitelist includes `0.0.0.0/0` (or your VPS IP).

---

## 🔄 Updating Your Live Application

Whenever you push new code or features to GitHub, update your VPS with zero downtime:

```bash
sudo bash /var/www/mithilakart/deploy/update.sh
```

---

## ⚙️ Daily Management Commands

| Action | Command |
|---|---|
| Check backend status | `pm2 status` |
| View live backend logs | `pm2 logs mithilakart-api` |
| Restart backend API | `pm2 reload mithilakart-api` |
| View Nginx access/error logs | `tail -f /var/log/nginx/error.log` |
| Test Nginx configuration | `sudo nginx -t` |
| Reload Nginx | `sudo systemctl reload nginx` |
| Check Redis status | `systemctl status redis-server` |
| Check API health directly | `curl http://127.0.0.1:5000/health` |
| Manually renew SSL certificates | `sudo certbot renew` |

---

## 🔒 Configuration Files on VPS

- **Backend Environment:** `/var/www/mithilakart/backend/.env`
- **Nginx Configuration:** `/etc/nginx/sites-available/mithilakart`
- **PM2 Configuration:** `/var/www/mithilakart/ecosystem.config.js`
- **Application Files:** `/var/www/mithilakart/`
