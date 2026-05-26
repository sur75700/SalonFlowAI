# SalonFlow AI — Android Real Device QA

## Status

Android preview APK has already been built through EAS.

Current state:

- App name: SalonFlow AI
- Slug: salonflowai
- Android package: com.surnonym19.salonflowai
- Distribution: internal
- Backend: Render production
- API URL: https://salonflowai-backend.onrender.com

## Preconditions

Use a clean Android test device when available.

Do not use a personal phone if setup/account access is unclear.

Google Play login is not required for direct APK install.

## APK Install Flow

1. Open the EAS Android APK build page on the Android device.
2. Download the APK.
3. Open the downloaded APK.
4. Allow install from unknown sources for the browser or Files app.
5. Install SalonFlow AI.
6. Open the app.

## QA Checklist

Verify:

- App opens without crash
- Login works
- Dashboard loads
- Clients screen loads
- Services screen loads
- Appointments screen loads
- Analytics screen shows AMD values
- Reports screen opens
- Logout works
- Login again works

## Expected Backend Behavior

Production health:

- /healthz -> 200 OK

Production analytics:

- /analytics/dashboard without token -> 401 Unauthorized
- /analytics/dashboard with token -> 200 OK and AMD analytics data

## Known Safe Production Checkpoints

- phase-8d-android-preview-apk-built
- phase-8h-production-render-env-verified
- phase-8i-final-release-status-synced

## Pass Criteria

Android QA is complete only when the APK is installed on a real Android device and all checklist items pass.

After successful Android QA, create tag:

phase-8d-android-preview-apk-tested

## Safety Rules

- Do not commit .env
- Do not print secrets
- Do not change backend production settings during device QA
- Do not reset or modify a borrowed phone account unless explicitly approved by the phone owner
