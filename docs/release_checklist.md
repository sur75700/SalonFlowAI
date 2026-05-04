# SalonFlowAI Release Checklist

## Core System
- [ ] Root repository is clean
- [ ] Mobile repository is clean
- [ ] Backend repository is in a known-good state
- [ ] Local backend health endpoint responds
- [ ] Production backend health endpoint responds
- [ ] Production admin login works

## Admin Experience
- [ ] Dashboard opens correctly
- [ ] Bookings Control opens correctly
- [ ] Client Registry opens correctly
- [ ] Service Catalog opens correctly
- [ ] Insights opens correctly
- [ ] PDF Reports opens correctly
- [ ] Workspace tab replaces default Expo starter page
- [ ] Close Session wording is correct
- [ ] Client Snapshot wording is correct
- [ ] Executive Snapshot wording is correct
- [ ] Export Readiness wording is correct

## Reports
- [ ] PDF export works with GET
- [ ] PDF date selection works
- [ ] Export button is visible and usable

## Deployment
- [ ] EXPO_PUBLIC_API_URL points to production backend
- [ ] expo-doctor has no critical blockers
- [ ] Web export works or acceptable non-blocking warnings only
- [ ] Render production backend is stable

## Demo Flow
- [ ] Login
- [ ] Review dashboard metrics
- [ ] Open bookings
- [ ] Open clients
- [ ] Open services
- [ ] Open insights
- [ ] Open PDF Reports
- [ ] Open workspace
