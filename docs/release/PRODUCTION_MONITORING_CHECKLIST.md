# SalonFlow AI — Production Monitoring Checklist

## Purpose

Provide a practical production monitoring and safety checklist before demos, pilots, and controlled production usage.

## Status

Production monitoring checklist prepared.

## Production Targets

Production backend:

https://salonflowai-backend.onrender.com

Primary production checks:

- Health endpoint
- Protected analytics endpoint
- Protected PDF export endpoint
- Login flow
- Render logs
- Release branch alignment

## Demo-Day Quick Check

Run before every serious demo or pilot conversation:

1. Confirm Git is clean.
2. Confirm current branch is phase-7-royal-hardening.
3. Confirm main is synchronized if production backend code changed.
4. Confirm Render backend is live.
5. Confirm /healthz returns 200 OK.
6. Confirm /analytics/dashboard without token returns 401 Unauthorized.
7. Confirm login works.
8. Confirm /analytics/dashboard with token returns 200 OK.
9. Confirm /reports/daily-summary/pdf without token returns 401 Unauthorized.
10. Confirm PDF export works through the app with a valid session.
11. Confirm no secrets are printed in terminal, browser, docs, screenshots, or chat.

## Render Health Check

Command:

curl -i https://salonflowai-backend.onrender.com/healthz

Expected:

HTTP 200

Expected body:

{"status":"ok"}

Fail condition:

- 5xx response
- timeout
- DNS error
- service unavailable
- unexpected JSON error

Action:

- Check Render dashboard
- Check service logs
- Trigger manual deploy only if needed
- Do not change production settings during a live demo unless absolutely necessary

## Protected Analytics Check

Unauthenticated command:

curl -i https://salonflowai-backend.onrender.com/analytics/dashboard

Expected:

HTTP 401 Unauthorized

Meaning:

Analytics is protected.

Fail condition:

- 200 OK without token

Action:

- Stop demo
- Do not show production analytics
- Investigate route protection before continuing

Authenticated expected behavior:

- /analytics/dashboard -> 200 OK
- AMD analytics data is returned
- Completed revenue, scheduled pipeline, cancelled value, and average ticket are visible

## Protected PDF Export Check

Unauthenticated command:

curl -i "https://salonflowai-backend.onrender.com/reports/daily-summary/pdf?date=YYYY-MM-DD&locale=en"

Expected:

HTTP 401 Unauthorized

Meaning:

PDF export is protected.

Authenticated expected behavior:

- HTTP 200
- content-type: application/pdf
- filename includes selected locale

Supported locales:

- en
- hy
- ru
- fr

Expected filenames:

- salonflow_daily_summary_en_YYYY-MM-DD.pdf
- salonflow_daily_summary_hy_YYYY-MM-DD.pdf
- salonflow_daily_summary_ru_YYYY-MM-DD.pdf
- salonflow_daily_summary_fr_YYYY-MM-DD.pdf

Fail condition:

- 200 OK without token
- PDF export returns JSON error with valid session
- filename does not include locale
- selected app language does not match PDF language
- Armenian/Russian content renders as square glyphs

Action:

- Re-check login session
- Re-check deployed branch
- Re-check Render latest commit
- Re-test through browser Network tab
- Do not print real tokens

## Render Logs Review

Before demo:

- Open Render backend service
- Review latest deploy status
- Confirm service is live
- Scan logs for repeated 500 errors
- Scan logs for import errors
- Scan logs for database connection failures
- Scan logs for auth or PDF export exceptions

Safe logging expectation:

- No secrets printed
- No JWT secrets printed
- No database credentials printed
- No full Authorization header printed

## Release Branch Alignment

Current development branch:

phase-7-royal-hardening

Production branch:

main

Rule:

If backend production behavior changes, merge the verified phase branch into main and push main.

Main sync flow:

git checkout main
git pull origin main
git merge --no-ff phase-7-royal-hardening -m "merge production readiness update into main"
git push origin main
git checkout phase-7-royal-hardening
git status

Expected after sync:

- main pushed successfully
- back on phase-7-royal-hardening
- git status clean

## Rollback Notes

If a bad production deployment happens:

1. Stop making additional changes.
2. Identify last known good commit or tag.
3. Confirm issue scope.
4. If backend production is affected, use Render deploy history or revert commit.
5. Prefer normal git revert over destructive history rewriting.
6. After rollback, verify health, analytics protection, login, and PDF export.
7. Document what happened.

Known strong checkpoints:

- phase-11o-final-four-language-qa-passed
- phase-12a-release-status-synced
- phase-12b-mobile-multilingual-qa-pack-ready
- phase-12d-final-demo-pilot-pack-ready

## Incident Severity Levels

### Blocker

Examples:

- Production backend down
- Login completely broken
- Analytics public without token
- PDF export public without token
- App cannot open

Action:

- Stop demo or pilot
- Fix before continuing

### Major

Examples:

- One main screen crashes
- Reports PDF fails with valid session
- Four-language switcher broken
- Backend returns repeated 500 errors

Action:

- Avoid affected demo area
- Fix before pilot usage

### Minor

Examples:

- Small layout overflow
- One untranslated text
- Non-critical visual issue

Action:

- Log issue
- Continue demo if core flow is safe

## What Not To Touch During Pilot

Do not:

- Change Render environment variables during live pilot
- Change auth logic during live pilot
- Expose tokens
- Run destructive database commands
- Delete demo data unless planned
- Commit generated PDF files
- Commit .env
- Push unverified backend changes to main

## Demo Production Readiness Checklist

Before a live demo, confirm:

- Git clean
- App opens
- Login works
- Dashboard loads
- Clients loads
- Services loads
- Bookings loads
- Analytics loads
- Reports loads
- Explore loads
- Language switcher works
- Four languages are visible
- PDF export is understood and tested
- Render backend health is OK
- Analytics without token returns 401
- PDF without token returns 401
- No red runtime errors
- No secrets visible

## Post-Demo Monitoring

After demo:

- Check Render logs
- Check if any 500 errors occurred
- Check if PDF export errors occurred
- Note user feedback
- Note any language/layout issues
- Update demo lead board if applicable
- Keep git clean

## Safety Rules

- Do not commit .env
- Do not commit node_modules
- Do not commit .expo
- Do not commit generated PDF reports
- Do not print secrets
- Do not weaken auth logic
- Keep analytics protected
- Keep PDF export protected
- Prefer reversible changes
- Verify Git clean before stopping work

## Final Result

SalonFlow AI has a production monitoring checklist suitable for demo-day confidence, controlled pilot usage, and safe production verification.
