# UOLJudge — Master Deployment Protocol

**Objective:** Deploy the full UOLJudge V4.0 stack in a university lab environment (Docker + Cloudflare Tunnel) with maximum reliability under restrictive networks.

---

## Prerequisites

| Item                                   | Requirement                                                                 |
|----------------------------------------|-----------------------------------------------------------------------------|
| **Host Laptop**                        | MacBook M1/M2 **or** Windows i7/Ryzen 7                                     |
| **Docker RAM Allocation**              | **≥ 6 GB** (critical – check Docker Desktop → Settings → Resources)        |
| **Software**                           | • Docker Desktop (running)<br>• Node.js v18+<br>• Cloudflared (installed)  |
| **Network**                            | USB-C Ethernet adapter **strongly recommended**                             |

---

## Phase 1: Environment Setup

```bash
# 1. Clone repository
git clone https://github.com/your-username/uol-judge.git
cd uol-judge
```

### Verify/Create .env (root directory)

```bash
DATABASE_URL="postgresql://admin:uol0512@db:5432/uol_judge?schema=public"
NEXT_PUBLIC_WS_URL="ws://localhost:3001"      # Will be overridden at runtime
NODE_ENV="production"
```


### Phase 2: Clean Slate Build
Only required when behind university proxy (172.26.x.x network)

```bash
# Mac / Linux
export http_proxy=http://172.26.4.51:3128
export https_proxy=http://172.26.4.51:3128

# Windows PowerShell
$Env:http_proxy="http://172.26.4.51:3128"
$Env:https_proxy="http://172.26.4.51:3128"
```

#### Build from scratch

```bash
# Remove everything old
docker-compose down -v

# Full rebuild (no cache)
docker-compose build --no-cache
```


## Phase 3: WebSocket “Hot Swap” (Critical Step)
Cloudflare free tier gives random subdomains → must patch WebSocket URL at deploy time.

**Terminal 1 – Start Socket Tunnel**

```bash
cloudflared tunnel --protocol http2 --url http://localhost:3001
```

→ Copy the generated URL, e.g. `https://brave-lion-77.trycloudflare.com`


#### Update Source Code

1. Open file:
    src/features/contest/hooks/useContestSocket.ts
2. Replace the WS_URL constant:

```typescript
const WS_URL = "wss://brave-lion-77.trycloudflare.com";
```

3. Save the file

#### Rebuild & Launch Containers

```bash
docker-compose up -d --build
```

Wait ~20 seconds for PostgreSQL to be ready.


## Phase 4: Launch & Seed Database

1. **Seed Admin Account (First-Time Only)**

```bash
docker-compose exec app tsx prisma/seed.ts
```

Expected output:
Created Super Admin: admin

2. **Expose Main Website (Terminal 2)**

```bash
cloudflared tunnel --protocol http2 --url http://localhost:3000
```
→ Copy the new URL, e.g. https://fast-panda-99.trycloudflare.com


## Phase 5: Admin Login & Monitoring

```bash
# All services
docker-compose logs -f

# Only Next.js app
docker-compose logs -f app
```