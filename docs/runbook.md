# SalonFlowAI Runbook

## Local Mobile
cd ~/Projects/SalonFlowAI/mobile
npx expo start -c

## Local Backend
cd ~/Projects/SalonFlowAI/backend
source .venv/bin/activate 2>/dev/null || true
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

## Local Health
curl -fsS http://127.0.0.1:8000/healthz

## Production Health
curl -fsS https://salonflowai-backend.onrender.com/healthz

## Production Login
curl -fsS -X POST https://salonflowai-backend.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@salonflowai.com","password":"Admin123456!"}'

## Notes
- PDF export route supports GET for file download.
- HEAD may return 405 and is non-blocking if GET works.
- Workspace replaces the default Expo Explore starter page.
