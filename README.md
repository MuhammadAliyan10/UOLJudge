
# 🚀 UOLJudge V4.0 - Deployment & Operations Manual

**System Role:** High-Performance Competitive Programming Platform  
**Architecture:** Offline-First, Dockerized, Hybrid Network (LAN/WAN)

---

## 🏗️ Part 1: Prerequisites (Before You Start)

### Hardware Requirements
- Host Machine: MacBook (M1/M2) or Windows Laptop (i7/Ryzen 7)
- RAM: **Minimum 6GB allocated to Docker** (Critical)
- Network: Ethernet Adapter (USB-C) **strongly recommended**

### Software Requirements
1. Docker Desktop: Installed and running
2. Node.js: Installed (v18+) for running local scripts
3. Cloudflared: Installed (for the Tunnel strategy)

---

## 🌍 Part 2: Building the System (Choose Your Scenario)

You **must** choose the correct build strategy based on your location.

### Scenario A: Building at Home (No Proxy / Open Internet)
Use this if you are testing at home or using a Personal Hotspot.

1. Open your Terminal (Mac) or PowerShell (Windows)
2. Run the clean build command:

```bash
# Remove old containers/volumes to start fresh
docker-compose down -v

# Build without cache
docker-compose build --no-cache
```

### Scenario B: Building at University (Behind Proxy)
Use this if you are connected to the Lab Ethernet/Wi-Fi (172.26...).

#### Step 1: Configure Docker Desktop
1. Open Docker Dashboard → Settings → Resources → Proxies
2. Turn ON **Manual Proxy**
3. HTTP & HTTPS: `http://172.26.4.52:3128`
4. Bypass: `localhost,127.0.0.1,10.*,192.168.*`
5. Click **Apply & Restart**

#### Step 2: Configure Terminal Session
Run these commands **before** building:

**Mac / Linux**
```bash
export http_proxy=http://172.26.4.52:3128
export https_proxy=http://172.26.4.52:3128
export HTTP_PROXY=http://172.26.4.52:3128
export HTTPS_PROXY=http://172.26.4.52:3128
```

**Windows PowerShell**
```powershell
$Env:http_proxy="http://172.26.4.52:3128"
$Env:https_proxy="http://172.26.4.52:3128"
```

#### Step 3: Run the Build
```bash
docker-compose build --no-cache
```

---

## 🚀 Part 3: Launching the System

Once built, the launch process is the same for everyone.

### 1. Start the Containers
```bash
docker-compose up -d
```
> Wait 15–20 seconds for the Database to initialize.

### 2. Seed the Database (CRITICAL - First Time Only)
You must create the Admin account manually.

```bash
docker-compose exec app ./node_modules/.bin/tsx prisma/seed.ts
```

**Success Message:** `✅ Created Super Admin: admin`

### 3. Login
- URL: http://localhost:3000/admin
- Username: `admin`
- Password: `uol_admin_2025`

---

## 📡 Part 4: Connecting Students (The Network)

### Option 1: Cloudflare Tunnel (Recommended)
Best for mixed networks (some on Lab PC, some on Laptops).

1. **Terminal 1** – Start the Pulse Engine:
   ```bash
   npx tsx server/ws-server.ts
   ```

2. **Terminal 2** – Start the Tunnel:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

3. Distribute the generated URL (e.g., `https://contest.aliyan-judge.me`) on the whiteboard.

### Option 2: Local LAN (Ethernet Only)
Best when Internet is unavailable. Requires Proxy Bypass on Client PCs.

1. Find your IP:
   - Windows: `ipconfig`
   - Mac: `ipconfig getifaddr en0`  
   Example: `10.20.5.14`

2. On each Student PC → Add your IP to **Proxy Exceptions**

3. Distribute URL: `http://10.20.5.14:3000`

---

## 📊 Part 5: Monitoring & Logs

```bash
# View all logs live
docker-compose logs -f

# View only the App logs (Next.js)
docker-compose logs -f app

# View Database logs (Postgres)
docker-compose logs -f db
```

---

## 🆘 Part 6: Troubleshooting Cheat Sheet

| Problem                          | Cause                              | Fix                                                                 |
|----------------------------------|------------------------------------|----------------------------------------------------------------------|
| "Build Failed" (Fetch Error)     | Proxy Settings missing             | Follow **Scenario B** – ensure proxy vars are exported               |
| "Database Connection Failed"     | DB still starting                  | Wait 30s → `docker-compose restart app`                              |
| "WebSocket Disconnected" (Red Dot)| Pulse Engine not running          | Run `npx tsx server/ws-server.ts` in a separate terminal             |
| "Command failed: spawn tsx ENOENT"| Dockerfile missing tsx            | Use the latest provided Dockerfile                                   |
| Students see "403 Forbidden"     | Student PC using Proxy             | Add your server IP to Proxy Exceptions on their PC                   |

---

## 💾 Part 7: Backup & Shutdown

### To Stop
```bash
docker-compose down
```

### To Backup Data
Copy the `pg-data` folder to a USB drive (contains **ALL** contest data).

### To Restore Data
```bash
1. docker-compose down
2. Delete current pg-data folder
3. Paste backup pg-data folder
4. docker-compose up -d
```

