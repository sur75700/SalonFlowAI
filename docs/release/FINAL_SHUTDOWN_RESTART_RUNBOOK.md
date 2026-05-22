# SalonFlow AI — Final Shutdown / Restart Runbook

## Purpose

Safe local shutdown and clean restart guide for SalonFlowAI.

## Stable Branch

phase-7-royal-hardening

## Safe Checkpoints

- phase-8h-production-render-env-verified
- phase-8i-final-release-status-synced
- phase-8j-android-qa-prepared

## Safe Shutdown

Run from project root:

cd ~/Projects/SalonFlowAI || exit 1
git status
pkill -f expo || true
pkill -f metro || true
pkill -f "node.*8081" || true
pkill -f "uvicorn app.main:app" || true
pkill -f "fastapi dev" || true
ss -ltnp | grep -E "8000|8081|19000|19001|19002" || echo "No SalonFlowAI dev ports listening"
git status

## Clean Restart

cd ~/Projects/SalonFlowAI || exit 1
git status
git branch --show-current
git log --oneline --decorate -8
git tag --list | grep phase-8

## Start Backend

cd ~/Projects/SalonFlowAI/backend || exit 1
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

Verify backend from another terminal:

curl -i http://127.0.0.1:8000/healthz
curl -i http://127.0.0.1:8000/analytics/dashboard

Expected:

- /healthz -> 200 OK
- /analytics/dashboard without token -> 401 Unauthorized

## Start Frontend

cd ~/Projects/SalonFlowAI/mobile || exit 1
npm run typecheck
npx expo-doctor
npx expo start -c --web

Open:

http://localhost:8081

## Production Security Check

curl -i https://salonflowai-backend.onrender.com/healthz
curl -i https://salonflowai-backend.onrender.com/analytics/dashboard

Expected:

- Production /healthz -> 200 OK
- Production /analytics/dashboard without token -> 401 Unauthorized

## Safety Rules

- Do not commit .env
- Do not commit node_modules
- Do not commit .expo
- Do not print secrets
- Keep analytics protected
- Verify Git clean before stopping work
- Use phase-7-royal-hardening for local mobile/frontend work
- Use main only for production backend deployment fixes when needed

## Next Work

- Android real-device APK QA when a clean Android phone is available
- Optional iOS/TestFlight path later
- Optional monitoring and final demo/sales packaging
