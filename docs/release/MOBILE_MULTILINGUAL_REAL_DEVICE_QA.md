# SalonFlow AI — Mobile Multilingual Real Device QA

## Purpose

Document the real-device QA process for verifying SalonFlow AI multilingual behavior on Android, iOS-ready flows, and Expo web.

## Status

Prepared for mobile multilingual QA.

## Current Product State

- App name: SalonFlow AI
- Slug: salonflowai
- Android package: com.surnonym19.salonflowai
- Version: 1.0.0
- Backend: Render production
- API URL: https://salonflowai-backend.onrender.com
- Active languages: English, Հայերեն, Русский, Français

## Build Context

Android preview APK is available through EAS internal distribution.

EAS profiles:

- development: internal development client
- preview: internal APK build
- production: Android App Bundle

Preview and production builds use:

- EXPO_PUBLIC_API_URL=https://salonflowai-backend.onrender.com

## Supported QA Targets

### Android

Primary real-device QA target.

Use a clean Android test device when available.

### iOS

Future-ready QA target.

Possible paths:

- Expo Go / local development testing
- EAS iOS build
- TestFlight distribution

Note: iOS/TestFlight release testing may require Apple Developer account setup.

### Web

Used for fast multilingual and PDF export validation through Expo web.

## Preconditions

Before device QA:

- Do not use a personal phone if account/device ownership is unclear.
- Do not reset or modify a borrowed phone account unless explicitly approved by the phone owner.
- Do not print secrets.
- Do not commit .env files.
- Make sure production backend is healthy.
- Make sure the build points to Render production backend.

Expected backend checks:

- /healthz -> 200 OK
- /analytics/dashboard without token -> 401 Unauthorized
- /analytics/dashboard with token -> 200 OK
- /reports/daily-summary/pdf without token -> 401 Unauthorized
- /reports/daily-summary/pdf with token and locale -> 200 OK PDF export

## Android APK Install Flow

1. Open the EAS Android APK build page on the Android device.
2. Download the APK.
3. Open the downloaded APK.
4. Allow install from unknown sources for the browser or Files app.
5. Install SalonFlow AI.
6. Open the app.
7. Confirm the app launches without crash.

## Core Login QA

Verify:

- Login screen opens.
- Language switcher is visible.
- Login works with approved test credentials.
- Session banner/action bar works.
- Logout works.
- Login again works.

## Four-Language QA Matrix

For each language, verify the main screens:

- English
- Հայերեն
- Русский
- Français

Screens to check:

- Auth / Login
- Dashboard
- Bookings / Appointments
- Clients
- Services / Service Catalog
- Analytics / Insights
- Reports
- Explore / Workspace
- Navigation tabs

For each screen, verify:

- Main title is translated.
- Main subtitle is translated.
- Buttons are translated.
- Form labels are translated.
- Empty states are translated.
- Error/retry states are translated when visible.
- Status badges are translated.
- No raw translation keys are visible.
- No unexpected English text remains in non-English mode.
- Layout does not break with long French/Russian/Armenian text.
- Cards do not overflow horizontally.
- Bottom tabs remain readable.
- Scroll behavior remains smooth.

## Dashboard QA

Verify per language:

- Dashboard hero text
- Business snapshot cards
- Quick actions
- Navigation cards
- Analytics summary
- Reports card
- Session actions

Pass criteria:

- No raw keys
- No text clipping that blocks usage
- Values and AMD currency display correctly

## Bookings QA

Verify per language:

- Create appointment form
- Client selector
- Service selector
- Booking time field
- Quick time buttons
- Booking filters
- Booking registry
- Status badges: Scheduled / Completed / Cancelled
- Edit / Complete / Cancel / Delete actions

Pass criteria:

- Booking CRUD remains usable
- Status badges are translated
- Long translated text does not break cards

## Clients QA

Verify per language:

- Create client form
- Search clients
- Client cards
- Edit mode
- Save / Cancel / Delete
- Empty state

Pass criteria:

- Client CRUD remains usable
- Phone/email/notes labels remain readable

## Services QA

Verify per language:

- Create service form
- Service name
- Duration
- Price
- Currency
- Active / inactive status
- Service cards
- Edit / Save / Delete
- Empty state

Pass criteria:

- Service CRUD remains usable
- Active/inactive badges are translated
- Price and duration stay readable

## Analytics QA

Verify per language:

- Analytics hero
- Executive snapshot
- Revenue trendline
- Top performing services
- Booking status distribution
- Chart legends
- Empty analytics states

Pass criteria:

- Chart labels are readable
- Pie chart uses legend cleanly
- No inner labels clutter the chart
- No raw keys

## Reports QA

Verify per language:

- Reports hero
- Daily PDF export card
- Date input
- Today / Yesterday shortcuts
- Export readiness
- Reporting workflow
- Export button
- Export language helper text

PDF export behavior:

- English UI -> English PDF
- Հայերեն UI -> Armenian PDF
- Русский UI -> Russian PDF
- Français UI -> French PDF

Expected filenames:

- salonflow_daily_summary_en_YYYY-MM-DD.pdf
- salonflow_daily_summary_hy_YYYY-MM-DD.pdf
- salonflow_daily_summary_ru_YYYY-MM-DD.pdf
- salonflow_daily_summary_fr_YYYY-MM-DD.pdf

Mobile note:

PDF export may be easiest to validate through web or a browser download flow, depending on mobile platform behavior.

Pass criteria:

- Export remains authenticated
- PDF filename includes locale
- PDF labels match selected language
- Armenian/Russian content renders without square glyphs

## Explore / Workspace QA

Verify per language:

- Workspace hero
- Quick navigation
- Backend access links
- API docs link
- Backend health link
- Operator notes

Pass criteria:

- Links open correctly
- Text is translated
- No raw keys

## iOS Future QA Path

When iOS testing becomes available:

1. Confirm Apple Developer account availability if TestFlight is needed.
2. Create EAS iOS build when ready.
3. Install through TestFlight or approved test method.
4. Repeat the four-language QA matrix.
5. Verify iOS layout, safe areas, tabs, and scroll behavior.
6. Verify login/logout.
7. Verify Reports behavior and PDF export path.

## Bug Report Format

For each issue, record:

- Device model
- OS version
- App build/profile
- Language
- Screen
- Steps to reproduce
- Expected result
- Actual result
- Screenshot/video if available
- Severity: blocker / major / minor / polish

## Pass Criteria

Mobile multilingual QA passes only when:

- Android APK installs on a real device.
- App opens without crash.
- Login/logout works.
- All four languages can be selected.
- Main screens work in all four languages.
- No raw i18n keys are visible.
- No major layout overflow blocks usage.
- Backend production integration works.
- Analytics loads protected data.
- Reports screen opens.
- PDF export behavior is verified through supported flow.
- Git remains clean after documentation updates.

## Checkpoint Tags

When this QA pack is prepared:

phase-12b-mobile-multilingual-qa-pack-ready

When Android four-language real-device QA passes:

phase-12c-android-four-language-real-device-qa-passed

When iOS four-language QA passes in the future:

phase-12d-ios-four-language-qa-passed

## Safety Rules

- Do not commit .env
- Do not commit node_modules
- Do not commit .expo
- Do not commit generated PDF reports
- Do not print secrets
- Do not weaken auth logic
- Keep analytics protected
- Keep PDF export protected
- Verify Git clean before stopping work
