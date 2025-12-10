# UOLJudge

**Enterprise-Grade Programming Contest Platform**

The most reliable, feature-complete judging system for university programming contests. Built for high-availability environments where failure is not an option.

---

## Why UOLJudge?

### vs. Codeforces / HackerRank

| Feature               | UOLJudge                 | Online Platforms     |
| --------------------- | ------------------------ | -------------------- |
| **Offline Operation** | ✅ 100% offline-capable  | ❌ Requires internet |
| **Network Latency**   | < 100ms (local)          | 200-500ms+           |
| **Data Privacy**      | ✅ Your data stays local | ❌ Cloud storage     |
| **Customization**     | ✅ Full source access    | ❌ Locked platform   |
| **Cost**              | ✅ Free, self-hosted     | 💰 Subscription fees |
| **Multi-Category**    | ✅ CORE, WEB, ANDROID    | ❌ Code only         |

### vs. DOMjudge / PC²

| Feature               | UOLJudge             | Traditional Systems    |
| --------------------- | -------------------- | ---------------------- |
| **Real-Time Updates** | ✅ WebSocket-powered | ❌ Polling/refresh     |
| **Modern UI**         | ✅ Premium shadcn/ui | ❌ Legacy interfaces   |
| **Setup Time**        | 5 minutes (Docker)   | Hours of configuration |
| **Mobile Support**    | ✅ Responsive design | ❌ Desktop only        |
| **Live Leaderboard**  | ✅ Instant updates   | ❌ Manual refresh      |

---

## Key Features

### 🎯 Zero-Trust Security

- **Role-based access control** — Admin, Jury, Participant isolation
- **Device limit enforcement** — Max 2 devices per team
- **Server-side time authority** — Clock manipulation impossible
- **Path traversal protection** — Secure file downloads

### ⚡ Real-Time Everything

- **WebSocket-powered** — < 100ms update propagation
- **Live leaderboard** — Animated score changes
- **Instant notifications** — Announcements, bans, grades
- **Presence indicators** — See who's grading what

### 🏆 ICPC-Standard Scoring

- **3-tier ranking** — Problems Solved → Score → Time Penalty
- **O(1) leaderboard reads** — Atomic accumulator pattern
- **Leaderboard freeze** — Hide final hour rankings
- **Penalty system** — 20-minute wrong answer penalties

### 📱 Multi-Category Support

- **CORE** — Traditional programming (C++, Python, Java)
- **WEB** — Frontend/fullstack projects (ZIP upload)
- **ANDROID** — Mobile apps (APK/ZIP upload)

### 🎬 Award Ceremony Generator

- **One-click export** — Interactive HTML ceremony
- **Keyboard-controlled** — Professional presentation
- **Fireworks animation** — Dramatic champion reveal
- **Offline playback** — Works without server

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
├─────────────┬─────────────┬─────────────┬───────────────┤
│   Next.js   │  WebSocket  │ PostgreSQL  │    Backup     │
│    :3000    │    :3001    │    :5435    │   Service     │
├─────────────┴─────────────┴─────────────┴───────────────┤
│                    uol-network                           │
└─────────────────────────────────────────────────────────┘
```

| Component      | Technology                      |
| -------------- | ------------------------------- |
| Frontend       | Next.js 14, React 18, shadcn/ui |
| Backend        | Server Actions, Prisma ORM      |
| Real-Time      | Custom WebSocket Server         |
| Database       | PostgreSQL 15 (Alpine)          |
| Infrastructure | Docker Compose                  |

---

## Quick Start

```bash
# Clone
git clone https://github.com/MuhammadAliyan10/UOLJudge.git
cd uol-judge

# Deploy
docker-compose up -d

# Initialize
docker-compose exec app npx prisma db push
docker-compose exec app tsx prisma/seed.ts

# Access
open http://localhost:3000
```

**Default Login:** `admin` / `uol0512`

---

## Performance

| Metric             | Value            |
| ------------------ | ---------------- |
| Concurrent Teams   | 100+             |
| WebSocket Latency  | < 100ms          |
| Leaderboard Update | O(1)             |
| DB Connection Pool | 200 max          |
| Auto-Backup        | Every 10 minutes |

---

## Security Features

- ✅ JWT authentication with production validation
- ✅ bcrypt password hashing
- ✅ Zero-trust role isolation
- ✅ Device session management
- ✅ Path traversal protection
- ✅ Contest registration locking
- ✅ Cascade delete prevention

---

## Documentation

- [Deployment Guide](DEPLOYMENT.md) — Production setup instructions
- [Prisma Schema](prisma/schema.prisma) — Database models

---

## Author

**Muhammad Aliyan**
Lead Architect & Systems Engineer
University of Lahore

---

## License

MIT License — Free for educational and commercial use.

---

**UOLJudge V4.0 — When the network fails, the contest never does.**
