# UOLJudge — Deployment Guide

**Version:** 4.0
**Last Updated:** December 2024

---

## Prerequisites

| Requirement      | Details                                        |
| ---------------- | ---------------------------------------------- |
| **Host Machine** | MacBook M1/M2 or Windows i7/Ryzen 7+           |
| **Docker RAM**   | ≥ 6 GB (Docker Desktop → Settings → Resources) |
| **Software**     | Docker Desktop, Node.js v18+                   |
| **Network**      | USB-C Ethernet adapter recommended             |

---

## Phase 1: Environment Setup

```bash
# Clone repository
git clone https://github.com/MuhammadAliyan10/UOLJudge.git
cd uol-judge
```

### Configure Environment Variables

Create `.env` in the root directory:

```env
# Database
DATABASE_URL="postgresql://admin:uol0512@localhost:5435/uol_judge?schema=public"

# WebSocket (change to your server IP in production)
NEXT_PUBLIC_WS_URL="ws://localhost:3001"

# Environment
NODE_ENV="development"
NEXT_PUBLIC_ENABLE_WS=true
```

---

## Phase 2: Build & Launch

```bash
# Clean build (first time or after major changes)
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

Wait ~20 seconds for PostgreSQL to initialize.

---

## Phase 3: Database Setup

```bash
# Push schema to database
docker-compose exec app npx prisma db push

# Seed admin account
docker-compose exec app tsx prisma/seed.ts
```

**Default Admin Credentials:**

- Username: `admin`
- Password: `uol0512`

---

## Phase 4: Production Configuration

Update `docker-compose.yml` with your server IP:

```yaml
environment:
  NEXT_PUBLIC_WS_URL: ws://YOUR_SERVER_IP:3001
  JWT_SECRET: "your-secure-production-secret"
```

---

## One-Command Deployment

```bash
docker-compose down -v && \
docker-compose build --no-cache && \
docker-compose up -d && \
echo "⏳ Waiting 15s for Database..." && \
sleep 15 && \
docker-compose exec app npx prisma db push && \
docker-compose exec app tsx prisma/seed.ts && \
echo "✅ SYSTEM READY! Login: admin / uol0512"
```

---

## Monitoring

```bash
# All services
docker-compose logs -f

# App only
docker-compose logs -f app

# WebSocket server
docker-compose logs -f ws-server
```

---

## Architecture

| Container   | Port | Purpose                    |
| ----------- | ---- | -------------------------- |
| `app`       | 3000 | Next.js application        |
| `ws-server` | 3001 | WebSocket real-time server |
| `db`        | 5435 | PostgreSQL database        |
| `backup`    | —    | Automated backup service   |

---

## Troubleshooting

| Issue                    | Solution                                         |
| ------------------------ | ------------------------------------------------ |
| WebSocket not connecting | Verify `NEXT_PUBLIC_WS_URL` matches server IP    |
| Login fails              | Check `JWT_SECRET` is set in production          |
| Database errors          | Run `docker-compose exec app npx prisma db push` |
| Container crash          | Check logs: `docker-compose logs -f app`         |

---

**UOLJudge V4.0 — Enterprise-Grade Contest Platform**
