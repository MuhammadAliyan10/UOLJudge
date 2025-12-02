# ⚡ UOLJudge  Industrial Edition

**Mission-Critical, Offline-First Competitive Programming Platform**  
Engineered for high-availability university environments with hostile or intermittent networks.

---

## 🏆 Overview

UOLJudge is a battle-tested judging system purpose-built for large-scale, on-campus programming contests (up to 3 concurrent contests, 100+ teams).  
It delivers **zero-latency real-time synchronization** while remaining fully functional behind restrictive proxies, NATs, and even complete internet outages.

---

## 🏗️ Architectural Highlights

### 1. The Pulse Engine — Real-Time Core
- Dedicated Node.js WebSocket server running on **port 3001**
- Replaces traditional polling entirely
- **< 100 ms** propagation of admin actions (Ban, Pause, Clarify, Grade) to 50–150+ clients
- Custom **Ping/Pong heartbeat protocol** engineered to survive aggressive university firewalls and transparent proxies

### 2. $Z$-Gate — Zero-Trust Security Layer
- Complete decoupling of business logic from client-side code
- **Server-side time authority** — client clock manipulation impossible
- **Strict Contest Binding** — teams are immutable-locked to a single contest; cross-contest submissions trigger instant transaction rollback
- All sensitive operations protected by server actions + Prisma transactions

### 3. Federated “Island” Deployment Model
- Single-host deployment (M1/M2 MacBook or Windows i7/Ryzen 7 laptop)
- Serves 100+ concurrent clients via **Cloudflare Tunnel** or direct LAN
- **100 % offline-first** — no external fonts, CDNs, analytics, or third-party APIs
- One-command launch: `docker-compose up -d`
- Automatic fallback to pure LAN mode when internet is unavailable

---

## 🛠️ Tech Stack

| Layer            | Technology                                           |
|------------------|------------------------------------------------------|
| Frontend         | Next.js 14 (App Router), Tailwind CSS, shadcn/ui     |
| Backend          | Next.js Server Actions + Custom Node.js WS Server   |
| Real-Time        | Standalone Pulse Engine (ws + heartbeat)             |
| Database         | PostgreSQL 15 (Alpine) + Prisma ORM                  |
| Infrastructure   | Docker Compose (multi-container)                     |
| Tunneling        | Cloudflared (zero-config secure tunnel)              |
| Monitoring       | λ-Gauge Dashboard (real-time CPU / RAM / WS metrics) |

---

## 🚀 Repository Structure
/src              → Feature modules (Admin, Contest, Jury, Team)
/server           → Pulse Engine (ws-server.ts)
/prisma           → Schema, migrations, seed scripts
/docker           → Dockerfiles + docker-compose.yml
/scripts          → Chaos testing, backup utilities
/public/ceremony  → Black Box static award generator


---

## 👉 Getting Started

Full deployment and operations instructions (including proxy workarounds, LAN fallback, and troubleshooting) are available in:

[DEPLOYMENT.md](DEPLOYMENT.md) — **Mandatory reading for contest hosts**

---

## 🛡️ Disaster Recovery & Ceremony Features

- **Black Box Ceremony Generator**  
  One-click export of a completely **static, self-contained HTML award ceremony**  
  Includes final rankings, animations, confetti, and sound — works 100 % offline even if the server is dead

- Manual grading override via Admin panel (bypass broken Jury UI)

- Persistent PostgreSQL volume (`pg-data`) — survives container restarts and host reboots

---

## ✍️ Author & Maintainer

**Muhammad Aliyan**  
Lead Architect & Systems Engineer  
University of Lahore – Speed Programming Contest Platform

---

**UOLJudge V4.0 — When the network fails, the contest never does.**