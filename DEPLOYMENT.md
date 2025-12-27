# UOLJudge — Deployment Guide

**Version:** 5.0
**Last Updated:** December 2025

---

## Prerequisites

| Requirement  | Details                                   |
| ------------ | ----------------------------------------- |
| **Server**   | Azure Standard_D4s_v3 (4 vCPU, 16GB RAM)  |
| **Docker**   | Docker Engine 24+ with Compose V2         |
| **Software** | Git, Node.js v18+ (for local development) |
| **Network**  | Public IP with ports 3000, 3001 open      |

---

## 🚀 Quick Deployment (Recommended)

We provide a CLI helper script `bin/uol-judge` to simplify management.

### 1. Clone & Setup

```bash
git clone https://github.com/MuhammadAliyan10/UOLJudge.git
cd uol-judge
chmod +x bin/uol-judge
```

### 2. Start Services

```bash
./bin/uol-judge start
```

### 3. Initialize Database

```bash
./bin/uol-judge init
```

Your instance is now running at `http://localhost:3000`.

---

## 🛠️ Manual Deployment

If you prefer running commands manually or need to debug specific steps.

### Phase 1: Clean Deployment (Fresh Start)

> ⚠️ **WARNING**: This will delete ALL existing data.

```bash
docker compose down
docker system prune -a --volumes -f
sudo rm -rf ./pg-data
git pull origin main
docker compose build --no-cache
docker compose up -d
```

### Phase 2: Database Setup

```bash
# Wait 15-20 seconds for DB to be ready
docker compose exec app npx prisma migrate deploy
docker compose exec app npx prisma db seed
```

---

## ⚙️ Configuration

Update `docker-compose.yml` with your production secrets.

```yaml
environment:
  # Database connection
  DATABASE_URL: "postgresql://admin:uol0512@db:5432/uol_judge?connection_limit=50"

  # Session encryption (CHANGE THIS!)
  JWT_SECRET: "your-secure-production-secret-minimum-32-chars"

  # WebSocket URL (your server's public IP)
  NEXT_PUBLIC_WS_URL: ws://YOUR_SERVER_IP:3001

  # Internal Docker networking
  INTERNAL_WS_URL: http://ws-server:3001

  # Required for HTTP deployments (no SSL)
  FORCE_INSECURE_COOKIES: "true"
```

---

## 📦 Backup & Restore

### Create Backup

```bash
./bin/uol-judge backup
```

_Or manually:_

```bash
docker compose exec db pg_dump -U admin uol_judge > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Backup

```bash
cat backup_file.sql | docker compose exec -T db psql -U admin uol_judge
```

---

## 🔍 Troubleshooting

| Issue                     | Solution                                                     |
| ------------------------- | ------------------------------------------------------------ |
| Container won't start     | `./bin/uol-judge logs`                                       |
| WebSocket not connecting  | Verify `NEXT_PUBLIC_WS_URL` matches server public IP         |
| Login fails               | Ensure `JWT_SECRET` is set and `FORCE_INSECURE_COOKIES=true` |
| Database connection error | Wait 20s after startup, then retry                           |

---

**UOLJudge V5.0 — Enterprise-Grade Competitive Programming Platform**
