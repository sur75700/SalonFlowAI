# SalonFlow AI — Final Production Demo Command Center

## Purpose

This is the master command center for running a professional SalonFlow AI production demo or pilot conversation.

Use this document before every serious demo to know:

- what to check
- what to open
- what to show
- what not to touch
- how to close the pilot conversation
- what to do after the demo

## Status

Final production demo command center prepared.

## Current Product State

SalonFlow AI is demo/pilot-ready with:

- Premium royal UI
- Protected admin login
- Dashboard
- Bookings / Appointments
- Clients
- Services / Service Catalog
- Analytics / Insights
- Reports
- Explore / Workspace
- Four active languages: English, Հայերեն, Русский, Français
- Multilingual PDF report export
- Render production backend
- Mobile QA path for Android, iOS-ready flow, and Expo web
- Production monitoring checklist
- Final demo / pilot readiness pack

## Open These Documents Before Demo

Primary documents:

1. docs/demo/FINAL_PRODUCTION_DEMO_COMMAND_CENTER.md
2. docs/demo/FINAL_DEMO_PILOT_READINESS_PACK.md
3. docs/release/PRODUCTION_MONITORING_CHECKLIST.md
4. docs/release/MOBILE_MULTILINGUAL_REAL_DEVICE_QA.md
5. docs/release/RELEASE_STATUS.md

Optional supporting documents:

- docs/demo/PRODUCT_DEMO_SCRIPT.md
- docs/demo/PILOT_SALES_ONE_PAGER.md
- docs/demo/DEMO_CLOSE_FOLLOWUP_PACK.md
- docs/demo/OUTREACH_MESSAGE_PACK.md
- docs/demo/FIRST_20_LEAD_EXECUTION_BOARD.md

## Pre-Demo Technical Checklist

Before demo, verify:

- Git status is clean
- Current branch is phase-7-royal-hardening
- main is synchronized if production backend code changed
- Render backend is live
- /healthz returns 200 OK
- /analytics/dashboard without token returns 401 Unauthorized
- /reports/daily-summary/pdf without token returns 401 Unauthorized
- App opens
- Login works
- Dashboard loads
- Reports opens
- Language switcher works
- No secrets are visible

## Pre-Demo Product Checklist

Verify in the app:

- Login screen looks clean
- Dashboard has premium presentation
- Bookings screen opens
- Clients screen opens
- Services screen opens
- Analytics screen opens
- Reports screen opens
- Explore screen opens
- Language switcher shows English, Հայերեն, Русский, Français
- No red runtime errors
- No raw translation keys are visible

## Recommended Demo Order

For a salon owner:

1. Login
2. Dashboard
3. Language switcher
4. Bookings
5. Clients
6. Services
7. Analytics
8. Reports
9. PDF export explanation
10. Pilot close questions

For a technical evaluator:

1. Login protection
2. Render backend health
3. Protected analytics
4. Protected PDF export
5. Mobile QA path
6. Release documentation
7. Rollback/monitoring readiness

For a multilingual audience:

1. Language switcher
2. Dashboard in four languages
3. Bookings/status badges in four languages
4. Reports UI in four languages
5. PDF export language behavior

## Five-Minute Demo Script

### 1. Login

Show that the workspace is protected.

Say:

SalonFlow AI is not a public dashboard. Business operations and analytics are behind login.

### 2. Dashboard

Show the daily command center.

Highlight:

- business snapshot
- bookings
- clients
- services
- today’s activity
- navigation cards

### 3. Language Switcher

Switch between:

- English
- Հայերեն
- Русский
- Français

Say:

The product supports four active languages, so different owners and operators can work in the language that is most natural for them.

### 4. Bookings

Show the appointment workflow.

Highlight:

- scheduled
- completed
- cancelled
- filters
- search
- status badges

### 5. Clients

Show client registry.

Highlight:

- organized contacts
- searchable records
- notes

### 6. Services

Show service catalog.

Highlight:

- service name
- price
- duration
- active/inactive status

### 7. Analytics

Show business insight.

Highlight:

- completed revenue
- scheduled pipeline
- cancelled value
- average completed ticket
- service performance
- booking status distribution

### 8. Reports

Show daily PDF report export.

Say:

Reports follow the selected language.

Expected:

- English UI -> English PDF
- Հայերեն UI -> Armenian PDF
- Русский UI -> Russian PDF
- Français UI -> French PDF

## Reports PDF Demo Order

1. Select app language.
2. Open Reports.
3. Explain daily report value.
4. Export PDF.
5. Confirm filename includes locale.
6. Explain that PDF export is authenticated.
7. Do not expose tokens or headers during demo.

Expected filenames:

- salonflow_daily_summary_en_YYYY-MM-DD.pdf
- salonflow_daily_summary_hy_YYYY-MM-DD.pdf
- salonflow_daily_summary_ru_YYYY-MM-DD.pdf
- salonflow_daily_summary_fr_YYYY-MM-DD.pdf

## Android / iOS / Web Status

### Android

Android preview APK path is prepared through EAS internal distribution.

Next real gate:

- Android real-device four-language QA

### iOS

iOS path is future-ready.

Possible paths:

- Expo Go development testing
- EAS iOS build
- TestFlight

Note:

TestFlight may require Apple Developer account setup.

### Web

Expo web is used for fast QA and PDF export validation.

## Production Monitoring During Demo

Use:

docs/release/PRODUCTION_MONITORING_CHECKLIST.md

Check:

- Render health
- protected analytics
- protected PDF export
- login flow
- logs after demo
- no exposed secrets

## Pilot Close Flow

After demo, ask:

- Is the workflow clear?
- Which screen is most valuable?
- Which language should the team use?
- Would daily PDF reports help?
- What is missing for your salon?
- Would you like to test this with sample data?

If yes:

- agree pilot scope
- agree pilot duration
- agree who will test
- agree what data will be entered
- agree feedback date

## Follow-Up Flow

Same day:

- send thank-you message
- summarize what was shown
- mention the key value points

Next day:

- send pilot summary
- ask for decision or next step

Three days later:

- send polite follow-up

Seven days later:

- final check-in

## Emergency Stop Rules

Stop the demo if:

- backend is down
- login fails
- analytics becomes public without token
- PDF export becomes public without token
- app crashes on main screen
- secrets are accidentally visible
- production data looks unsafe to show

If stopped:

1. Stay calm.
2. Do not expose technical details.
3. Say you will verify the environment.
4. Stop sharing screen if needed.
5. Check production monitoring checklist.
6. Resume only after safe state is restored.

## What Not To Touch

Do not:

- change Render environment variables during live demo
- change auth logic during live demo
- print tokens
- show Authorization headers
- show .env files
- run destructive database commands
- delete demo data unless planned
- commit generated PDFs
- push unverified backend changes to main
- overpromise unbuilt features

## Demo Pass Criteria

Demo passes if:

- app opens
- login works
- dashboard loads
- main screens open
- four languages are visible
- language switcher works
- reports screen opens
- PDF export behavior is explainable or demonstrated
- analytics loads with authenticated session
- no raw i18n keys are visible
- no secrets are exposed
- salon owner understands the product value

## Demo Fail Criteria

Demo fails if:

- app cannot open
- login does not work
- production backend is down
- analytics is public without token
- PDF export is public without token
- major screen crashes
- raw keys are visible across main screens
- secrets are shown

## Related Documents

- docs/demo/FINAL_DEMO_PILOT_READINESS_PACK.md
- docs/demo/PRODUCT_DEMO_SCRIPT.md
- docs/demo/PILOT_SALES_ONE_PAGER.md
- docs/demo/DEMO_CLOSE_FOLLOWUP_PACK.md
- docs/release/PRODUCTION_MONITORING_CHECKLIST.md
- docs/release/MOBILE_MULTILINGUAL_REAL_DEVICE_QA.md
- docs/release/FINAL_FOUR_LANGUAGE_QA.md
- docs/release/RELEASE_STATUS.md

## Final Result

SalonFlow AI has a single production demo command center for safe, polished, multilingual demo and pilot execution.
