# SalonFlow AI — Release Status

## Current branch

phase-7-royal-hardening

## Current release state

SalonFlowAI is in Phase 8E release-readiness and live QA polish.

The project has moved beyond recovery and bug-rescue into production-style hardening, mobile build readiness, documentation, and real-device QA preparation.

## Latest verified commit

6d77210 phase 8e rewrite mobile readme

## Stable checkpoints

- phase-7-royal-hardening-core
- phase-8a-release-readiness-analytics-fix
- phase-8a-backend-analytics-cleanup
- phase-8b-mobile-eas-ready
- phase-8c-mobile-api-release-safe
- phase-8d-android-preview-apk-built

## Phase 8A — Backend analytics cleanup

Status: complete

Verified:

- Duplicate analytics router wiring removed
- Legacy public analytics route removed
- Protected analytics route active
- /analytics/dashboard without token returns 401 Unauthorized
- /analytics/dashboard with token returns AMD revenue data
- Frontend analytics response mapping fixed

## Phase 8B — Mobile EAS readiness

Status: complete

Verified:

- App identity updated to SalonFlow AI
- Slug updated to salonflowai
- Scheme updated to salonflowai
- EAS config added
- EAS project linked
- Android package ID saved
- TypeScript checks passing
- Expo Doctor passing 17/17

## Phase 8C — Release-safe API URL strategy

Status: complete

Verified:

- EXPO_PUBLIC_API_URL supported
- Preview and production EAS builds use Render backend URL
- Local fallback strategy preserved
- Mobile typecheck passing
- Expo Doctor passing

## Phase 8D — Android preview APK build

Status: build complete

Verified:

- Android preview APK built through EAS
- Distribution: internal
- Package ID: com.surnonym19.salonflowai
- Android real-device QA is postponed until a clean Android test device is available

## Phase 8E — Release QA documentation

Status: in progress

Completed:

- Release QA runbook added
- Mobile README rewritten from default Expo starter README into SalonFlowAI-specific mobile documentation

Remaining:

- Final web QA pass
- Android real-device APK QA
- Release checkpoint tag after QA
- Optional production/security environment audit

## Verified runtime state

Backend local runtime:

http://127.0.0.1:8000

Frontend / Expo web runtime:

http://localhost:8081

Expected backend behavior:

- /healthz -> 200 OK
- /analytics/dashboard without token -> 401 Unauthorized

Protected analytics with login token has been verified with current AMD values:

- completed_revenue: 12050 AMD
- scheduled_pipeline: 53000 AMD
- cancelled_value: 22000 AMD
- avg_completed_booking_value: 6025 AMD

## Mobile QA gates

Required before mobile/release commits:

- npm run typecheck
- npx expo-doctor

Current expected result:

- TypeScript passes
- Expo Doctor passes 17/17 checks

## Web QA checklist

- Login
- Dashboard
- Clients
- Services
- Appointments
- Analytics AMD numbers
- Reports
- Logout/Login

## Android QA checklist

When a clean Android test device is available:

- Open EAS Android APK link
- Download APK
- Allow install from unknown sources
- Install SalonFlow AI
- Open app
- Login
- Check Dashboard
- Check Clients
- Check Services
- Check Appointments
- Check Analytics AMD numbers
- Check Reports
- Check Logout/Login

If Android QA passes, create tag:

phase-8d-android-preview-apk-tested

## Release safety rules

- Do not commit .env
- Do not commit node_modules
- Do not commit .expo
- Do not commit generated PDF reports
- Keep analytics protected
- Verify Git clean before stopping work

## Release conclusion

SalonFlowAI is currently in a strong release-readiness state.

The backend is protected and verified, the mobile app is EAS-ready, the Android preview APK has been built, release-safe API configuration is active, and documentation is being finalized for repeatable QA and deployment workflows.
