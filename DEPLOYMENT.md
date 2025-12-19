# UOLJudge — Deployment Guide

**Version:** 5.0
**Last Updated:** December 12, 2025

---

## Prerequisites

| Requirement  | Details                                   |
| ------------ | ----------------------------------------- |
| **Server**   | Azure Standard_D4s_v3 (4 vCPU, 16GB RAM)  |
| **Docker**   | Docker Engine 24+ with Compose V2         |
| **Software** | Git, Node.js v18+ (for local development) |
| **Network**  | Public IP with ports 3000, 3001 open      |

---

## Phase 1: Initial Server Setup

### 1.1 SSH into Azure Server

```bash
ssh <your-username>@<your-server-ip>
```

### 1.2 Install Docker (if not installed)

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again, then verify
docker --version
docker compose version
```

### 1.3 Clone Repository

```bash
git clone https://github.com/MuhammadAliyan10/UOLJudge.git
cd UOLJudge
```

---

## Phase 2: Clean Deployment (Fresh Start)

> ⚠️ **WARNING**: This will delete ALL existing data including teams, submissions, and contest history.

### 2.1 Stop All Running Containers

```bash
docker compose down
```

### 2.2 Remove All Docker Artifacts

```bash
# Remove containers, images, volumes, and networks
docker system prune -a --volumes -f
```

### 2.3 Delete PostgreSQL Data

```bash
# Remove the persistent database data folder
sudo rm -rf ./pg-data
```

### 2.4 Pull Latest Code

```bash
git pull origin main
```

### 2.5 Build Fresh Docker Images

```bash
docker compose build --no-cache
```

### 2.6 Start All Services

```bash
docker compose up -d
```

### 2.7 Wait for Database Initialization

```bash
# Wait 15-20 seconds for PostgreSQL to be ready
sleep 15
```

### 2.8 Run Database Migrations

```bash
docker compose exec app npx prisma migrate deploy
```

### 2.9 Seed Initial Data

```bash
docker compose exec app npx prisma db seed
```

### 2.10 Verify Deployment

```bash
# Check all containers are running
docker compose ps

# View application logs
docker compose logs -f app
```

---

## Phase 3: Quick One-Command Deployment

For experienced users, run everything in one command:

```bash
cd /path/to/UOLJudge && \
docker compose down && \
docker system prune -a --volumes -f && \
sudo rm -rf ./pg-data && \
git pull origin main && \
docker compose build --no-cache && \
docker compose up -d && \
echo "⏳ Waiting 20s for Database..." && \
sleep 20 && \
docker compose exec app npx prisma migrate deploy && \
docker compose exec app npx prisma db seed && \
echo "✅ DEPLOYMENT COMPLETE!"
```

---

## Phase 4: Configuration

### 4.1 Environment Variables

Update `docker-compose.yml` with your server configuration:

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

  # File storage location
  UPLOAD_DIR: "/app/storage"
```

### 4.2 Default Admin Credentials

| Username | Password  |
| -------- | --------- |
| `admin`  | `uol0512` |

> 🔐 **IMPORTANT**: Change the admin password after first login!

---

## Phase 5: Monitoring & Logs

### View All Logs

```bash
docker compose logs -f
```

### View Specific Service Logs

```bash
# Application logs
docker compose logs -f app

# WebSocket server logs
docker compose logs -f ws-server

# Database logs
docker compose logs -f db
```

### Check Container Status

```bash
docker compose ps
```

### Monitor Resource Usage

```bash
docker stats
```

---

## Phase 6: Backup & Restore

### Create Database Backup

```bash
docker compose exec db pg_dump -U admin uol_judge > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database Backup

```bash
cat backup_YYYYMMDD_HHMMSS.sql | docker compose exec -T db psql -U admin uol_judge
```

---

## Architecture

| Container   | Port | Purpose                    | Resources      |
| ----------- | ---- | -------------------------- | -------------- |
| `app`       | 3000 | Next.js application        | 2.5 CPU, 2GB   |
| `ws-server` | 3001 | WebSocket real-time server | 0.5 CPU, 256MB |
| `db`        | 5432 | PostgreSQL database        | 1.0 CPU, 1GB   |
| `backup`    | —    | Automated backup service   | 0.25 CPU, 64MB |

---

## Troubleshooting

| Issue                     | Solution                                                     |
| ------------------------- | ------------------------------------------------------------ |
| Container won't start     | Check logs: `docker compose logs -f app`                     |
| WebSocket not connecting  | Verify `NEXT_PUBLIC_WS_URL` matches server public IP         |
| Login fails               | Ensure `JWT_SECRET` is set and `FORCE_INSECURE_COOKIES=true` |
| Database connection error | Wait 20s after startup, then retry                           |
| File upload fails         | Check `UPLOAD_DIR` is mounted and writable                   |
| Leaderboard not updating  | Verify WebSocket connection in browser console               |

---

## Update Deployment (Without Data Loss)

For updates that preserve existing data:

```bash
cd /path/to/UOLJudge && \
git pull origin main && \
docker compose build --no-cache && \
docker compose up -d && \
docker compose exec app npx prisma migrate deploy && \
echo "✅ UPDATE COMPLETE!"
```

---

**UOLJudge V5.0 — Enterprise-Grade Competitive Programming Platform**
