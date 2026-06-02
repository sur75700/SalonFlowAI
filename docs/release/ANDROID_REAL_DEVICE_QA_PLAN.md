# SalonFlow AI — Android Real-Device QA Plan

## Purpose

Prepare the controlled Android real-device QA workflow for SalonFlow AI before Google Play internal testing and public release.

This document supports Phase 14E.

## Status

Android real-device QA plan prepared.

## Target Device

Primary test device:

- Xiaomi Android phone or another clean Android device

## Current Android Configuration

App name:

SalonFlow AI

Android package:

com.surnonym19.salonflowai

Version:

1.0.0

## Build Profiles

Preview build:

- EAS profile: preview
- Android build type: APK
- Distribution: internal
- Backend: https://salonflowai-backend.onrender.com

Production build:

- EAS profile: production
- Android build type: app-bundle
- Backend: https://salonflowai-backend.onrender.com

## Recommended QA Path

Use the preview APK path first.

Reason:

- APK is easier to install directly on a real Android device
- Good for internal QA before Google Play
- Does not require Play Console internal testing yet

## Pre-QA Requirements

Before testing on device:

- Git status clean
- TypeScript check passes
- Expo Doctor passes 17/17
- Backend compileall passes
- Render backend live
- Login credentials available privately
- No secrets printed in terminal, docs, screenshots, or chat

## Build Command

From mobile directory:

eas build --platform android --profile preview

## Install Path

After build completes:

1. Download the APK from EAS build link.
2. Transfer/open APK on Xiaomi device.
3. Allow installation from trusted source if needed.
4. Install app.
5. Open app.

## Android QA Checklist

### Launch

- App installs
- App opens
- Splash/icon appears acceptably
- No crash on first launch

### Authentication

- Login screen opens
- Login works with valid account
- Invalid login does not crash
- Logout works
- Re-login works

### Dashboard

- Dashboard opens
- Main cards render
- No layout overflow
- Loading/empty/error states behave correctly

### Bookings / Appointments

- Screen opens
- List loads
- Create/edit/delete behavior works if tested
- Status labels render correctly
- No crash on empty state

### Clients

- Screen opens
- Client list loads
- Search works
- Create/edit/delete behavior works if tested
- Empty/search states work

### Services

- Screen opens
- Service catalog loads
- Create/edit/delete behavior works if tested
- Price/duration/status display correctly

### Analytics

- Protected analytics opens after login
- Charts/cards render
- No crash on empty data
- No protected data available without session

### Reports

- Reports screen opens
- PDF export path works if tested
- Unauthorized export remains protected
- No generated PDFs committed to Git

### Languages

Check active languages:

- English
- Armenian
- Russian
- French

Verify:

- language switcher works
- no obvious English leftovers in key screens
- layout stays stable after switching languages

### Branding

Verify:

- app icon looks acceptable on device
- splash icon looks acceptable
- app name displays correctly
- no old/default React branding appears in user-facing launch flow

## Failure Handling

If a test fails:

1. Record exact screen.
2. Record device model.
3. Record Android version if available.
4. Record steps to reproduce.
5. Do not make random fixes.
6. Create a focused fix branch/commit.
7. Verify with typecheck and Expo Doctor.

## What Not To Do

Do not:

- publish to Google Play before real-device QA
- expose demo credentials in Git
- screenshot private client data
- commit generated PDFs
- change production backend settings during QA
- run destructive database commands
- overpromise store availability before release

## Completion Criteria

Phase 14E can be passed when:

- APK build path is confirmed
- app installs on Android device
- app opens without crash
- login works
- main screens open
- reports/analytics remain protected
- multilingual UI is checked
- logo/splash are visually acceptable
- QA result is documented
- Git status is clean

## Final Result

SalonFlow AI has a controlled Android real-device QA plan ready for preview APK testing on a Xiaomi or other Android device.
