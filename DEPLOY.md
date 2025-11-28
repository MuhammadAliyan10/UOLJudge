# 🚀 UOLJudge Deployment Runbook

**Objective:** Deploy the UOLJudge system in an offline-first, production-ready Docker environment.

## 📋 Prerequisites

1.  **Docker Desktop**: Ensure Docker Desktop is installed and running.
    *   [Download for Mac/Windows](https://www.docker.com/products/docker-desktop/)

## 🛠️ Deployment Steps

### 1. Launch the System
Open your terminal in the project root and run:

```bash
docker-compose up -d --build
```

*   `up`: Starts the containers.
*   `-d`: Detached mode (runs in background).
*   `--build`: Forces a rebuild of the images to ensure latest code.

### 2. Verify Status
Check if all services are running (db, app, ws-server):

```bash
docker-compose ps
```

You should see 3 services with status `Up`.

### 3. Access the Application
*   **Web App**: [http://localhost:3000](http://localhost:3000)
*   **Admin Panel**: [http://localhost:3000/admin](http://localhost:3000/admin)

### 4. View Logs
To monitor the application logs in real-time:

```bash
docker-compose logs -f
```

To view logs for a specific service (e.g., the app):
```bash
docker-compose logs -f app
```

## 🧪 Stress Testing (Chaos Test)
To verify system stability under load:

1.  Ensure the app is running (`docker-compose up -d`).
2.  Run the chaos script:

```bash
npx tsx scripts/chaos-test.ts
```

This will simulate 50 concurrent users hitting the server. Look for "✅ SYSTEM STABLE".

## 🆘 Disaster Recovery & Persistence

### Database Persistence
All database data is stored in the `./pg-data` folder in your project root. **This folder is your lifeblood.**

### Backup
To backup the database, simply copy the `pg-data` folder to a secure location (e.g., a USB drive).

```bash
# Stop containers first to ensure data integrity
docker-compose down

# Copy folder
cp -r pg-data /path/to/backup/location/
```

### Restore
1.  Stop containers: `docker-compose down`
2.  Delete existing `pg-data` (if corrupted).
3.  Copy your backup `pg-data` folder back to the project root.
4.  Start containers: `docker-compose up -d`

## 🛑 Shutdown
To stop all services:

```bash
docker-compose down
```
