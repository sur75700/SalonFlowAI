# SalonFlowAI — Phase 8E Release QA Runbook

## Stable State

Branch: phase-7-royal-hardening

Latest checkpoint:
- phase-8d-android-preview-apk-built

Important tags:
- phase-7-royal-hardening-core
- phase-8a-release-readiness-analytics-fix
- phase-8a-backend-analytics-cleanup
- phase-8b-mobile-eas-ready
- phase-8c-mobile-api-release-safe
- phase-8d-android-preview-apk-built

## Verified Runtime

Backend:
- http://127.0.0.1:8000
- /healthz -> 200 OK
- /analytics/dashboard without token -> 401 Unauthorized

Frontend:
- http://localhost:8081
- npm run typecheck -> PASS
- expo-doctor -> 17/17 PASS

## Analytics Verified Values

- completed_revenue: 12050 AMD
- scheduled_pipeline: 53000 AMD
- cancelled_value: 22000 AMD
- avg_completed_booking_value: 6025 AMD

## Web QA Checklist

- Login
- Dashboard
- Clients
- Services
- Appointments
- Analytics AMD numbers
- Reports
- Logout/Login

## Android Preview APK

Android preview APK build is completed.

Package ID:
com.surnonym19.salonflowai

Android real-device QA is postponed until a clean Android test device is ready.

## Next Steps

- Mobile README professional rewrite
- Release status update
- Android real-device APK test
- Tag after Android test: phase-8d-android-preview-apk-tested
