# OneEngage AI Sales Agent — Frontend Runbook

## Quick reference

| Service | Port | URL |
|---|---|---|
| Frontend (Next.js) | 3000 | http://localhost:3000 |
| V2 Backend API | 8101 | http://127.0.0.1:8101/docs |
| V3 Backend API | 8102 | http://127.0.0.1:8102/docs |

---

## How to start the frontend

```powershell
cd "C:\path\to\Frontend Updated test  AI sales agent\ai-sales-agent-frontend"
npm run dev
```

Open http://localhost:3000 in Chrome or Edge.

---

## First-time setup

```powershell
# 1. Install Node dependencies
npm install

# 2. Copy environment config
copy .env.local.example .env.local
# Edit .env.local if your backend runs on different ports
```

### `.env.local` reference

```
NEXT_PUBLIC_V2_API_BASE_URL=http://127.0.0.1:8101
NEXT_PUBLIC_V3_API_BASE_URL=http://127.0.0.1:8102
NEXT_PUBLIC_ENABLE_MANUAL_TRIGGER=true
NEXT_PUBLIC_ENABLE_DEMO_SEED=true
```

If both variables are missing, the app falls back to `http://localhost:8101` and `http://localhost:8102`.

---

## Common errors and fixes

### White screen / app won't load
1. Check browser console (F12) for errors.
2. Ensure the backend is running — test:
   ```powershell
   Invoke-RestMethod http://127.0.0.1:8101/health
   Invoke-RestMethod http://127.0.0.1:8102/health
   ```
3. Check `.env.local` has the correct API URLs.

### API call fails with CORS error
The backend `.env` must include the frontend origin in `FRONTEND_CORS_ORIGINS`:
```
FRONTEND_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```
Restart the backend after changing.

### Email template images not rendering in preview
Templates pull images from the backend's public media URL. Ensure `NEXT_PUBLIC_V2_API_BASE_URL` and `NEXT_PUBLIC_V3_API_BASE_URL` point to a running backend.

### Port 3000 already in use
```powershell
netstat -ano -p tcp | Select-String ":3000"
taskkill /PID <pid> /F
```
Then restart with `npm run dev`.

### Module not found / dependency error
```powershell
npm install
npm run dev
```

---

## Page map

| Page | Nav label | Backend module |
|---|---|---|
| Dashboard | Dashboard | v2-lifecycle + v3-journey |
| Template Rules | Template Rules | v2-lifecycle (template-rules API) |
| Agent Control | Agent Control | shared-settings |
| Performance | Performance | v2-lifecycle |
| Existing — Life Updates | Existing Customers | v2-lifecycle |
| Existing — Migration | Migration | v2-lifecycle |
| Inactive — Transaction | Inactive (Tx) | v3-signals + v3-journey |
| Inactive — OneBank | Inactive (App) | v3-app-dormant |
| Reports | Reports | all modules |
| Audit | Audit | all modules |
| Settings | Settings | shared-settings |

---

## Build for production

```powershell
npm run build
npm run start
```

Or export static files for deployment:
```powershell
npm run build
# Output in .next/ — serve with Node or upload to CDN
```

---

## Versioning

Current version: tracked in the parent monorepo `VERSION` file and git tags (`v1.0.0`, etc.).

Frontend branch: `dev`
Backend branch: `main`
Remote: https://github.com/Tee1115/ai-sales-agent-monorepo
