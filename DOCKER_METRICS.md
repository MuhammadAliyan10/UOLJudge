# Docker Host Metrics Configuration

## Issue
When running in Docker, the metrics API shows **Docker container** stats instead of **host system** (your Mac) stats.

## Solution Options

### Option 1: Mount Host Procfs (Linux/Mac)
If you want to monitor the **host system** from within Docker:

**Update `docker-compose.yml` or `docker run` command**:
```yaml
services:
  app:
    volumes:
      - /proc:/host/proc:ro  # Mount host /proc
      - /sys:/host/sys:ro    # Mount host /sys
      - /:/rootfs:ro         # Mount root filesystem
    environment:
      - HOST_PROC=/host/proc
      - HOST_SYS=/host/sys
```

### Option 2: Docker Stats API
Use Docker API to get host metrics:

```bash
# Run with Docker socket mounted
docker run -v /var/run/docker.sock:/var/run/docker.sock
```

### Option 3: External Metrics Service (Recommended for Production)
Run a metrics exporter on the host:

```bash
# Install node-exporter or similar
docker run -d \
  --net="host" \
  --pid="host" \
  -v "/:/host:ro,rslave" \
  prom/node-exporter
```

## Current Behavior
- **Local Development (npm run dev)**: Shows your Mac's real CPU, Memory, Disk  ✅
- **Docker Container**: Shows container's allocated resources ⚠️

## For Your Mac Development
Since you're running `npm run dev` on your Mac (not in Docker), the metrics **already show your real Mac stats**! 🎉

The `df /` command and `os` module will show:
- Your Mac's CPU load
- Your Mac's total RAM
- Your Mac's disk space

## To Verify
1. Open Activity Monitor on your Mac
2. Navigate to `http://localhost:3001/admin`
3. Compare the metrics shown in the dashboard with Activity Monitor
4. They should match! ✅

If you later deploy with Docker and want host metrics, use Option 1 above.
