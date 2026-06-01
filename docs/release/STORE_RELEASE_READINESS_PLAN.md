# SalonFlow AI — Store Release Readiness Plan

## Purpose

Prepare SalonFlow AI for professional release readiness across Web, Android, Google Play, iOS, and Apple App Store.

This plan defines the remaining gates before public store launch.

## Status

Store release readiness plan prepared.

## Current Product State

SalonFlow AI currently has:

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
- Multilingual PDF export
- Render production backend
- EAS Android preview/production build profiles
- Mobile multilingual QA pack
- Production monitoring checklist
- First real outreach/demo preview sent

## Current Technical Status

Verified:

- TypeScript passes
- Expo Doctor passes 17/17 checks
- Backend compileall passes
- Git status clean
- Branch: phase-7-royal-hardening
- Production branch: main
- Render backend configured for EAS preview/production builds

## Mobile Configuration Snapshot

App name:

SalonFlow AI

Slug:

salonflowai

Version:

1.0.0

Android package:

com.surnonym19.salonflowai

EAS profiles:

- development: internal development client
- preview: internal APK build
- production: Android App Bundle

Production backend:

https://salonflowai-backend.onrender.com

## Important Configuration Gate

Before store submission, verify that production mobile builds use:

EXPO_PUBLIC_API_URL=https://salonflowai-backend.onrender.com

Current EAS preview and production profiles already define this environment variable.

Also review app.json extra values before final store build:

- apiBaseUrlWeb
- apiBaseUrlNative

Do not change these blindly. Confirm actual app API client behavior first.

## Store Release Gates

### Gate 1 — Android Real Device QA

Required device:

- Xiaomi Android phone or another clean Android test device

Checks:

- Install APK
- Open app
- Login
- Dashboard
- Bookings
- Clients
- Services
- Analytics
- Reports
- Explore
- Language switcher
- EN/HY/RU/FR UI
- Logout/login
- No crash
- No major layout overflow

Result tag after pass:

phase-14e-android-real-device-qa-passed

### Gate 2 — iPhone / iOS Path

Current iPhone issue is expected for local development when Expo Go/LAN or protected login flow does not work smoothly.

Final iOS path should be:

- EAS iOS build
- TestFlight testing
- App Store submission

Needs:

- Apple Developer account
- App Store Connect setup
- Review demo account or approved demo mode
- iOS screenshots
- Privacy details

Result tag after preparation:

phase-14f-ios-testflight-path-prepared

### Gate 3 — Royal Cosmic Brand Assets

Required:

- Final app icon
- Android adaptive icon foreground
- Android adaptive icon background
- Android monochrome icon
- iOS icon
- Splash icon
- Favicon
- Store feature graphic
- App screenshots
- Dark/light brand usage rules

Result tag:

phase-14b-royal-cosmic-brand-assets-ready

### Gate 4 — Legal Pack

Required:

- Privacy Policy
- Terms of Service
- Data handling summary
- Authentication note
- Contact/support email
- Store privacy answers

Result tag:

phase-14c-legal-pack-ready

### Gate 5 — Store Metadata

Required:

- Short description
- Full description
- Keywords
- Category
- Support URL
- Marketing URL if available
- App screenshots captions
- Review notes
- Demo account instructions

Result tag:

phase-14d-store-listing-metadata-ready

### Gate 6 — Google Play Internal Testing

Required:

- Google Play Developer account
- Play Console app created
- Android App Bundle build
- Internal testing release
- Tester access
- Install test
- Login test
- Four-language QA test

Result tag:

phase-14g-google-play-internal-test-ready

### Gate 7 — Apple TestFlight / App Store Preparation

Required:

- Apple Developer account
- App Store Connect app created
- EAS iOS build
- TestFlight build uploaded
- Review info prepared
- Demo account or approved demo mode
- Privacy details completed

Result tag:

phase-14h-apple-testflight-ready

## AI Model Layer Timing

Do not start full AI model integration before real feedback is collected.

Correct sequence:

1. Real outreach
2. Demo preview
3. Reply tracking
4. Live demo or feedback
5. Android/iOS QA
6. Store readiness
7. AI feature planning based on real salon needs

Possible AI features later:

- AI daily salon summary
- AI revenue explanation
- AI booking risk insights
- AI client notes summarizer
- AI report wording assistant
- AI multilingual owner assistant
- AI follow-up suggestion engine

## What Not To Do Yet

Do not:

- Rush public store release without Android real-device QA
- Claim iOS is live before TestFlight/App Store setup
- Add AI features before user feedback
- Change production auth during demo/pilot phase
- Expose tokens or secrets
- Submit to stores without Privacy Policy and Terms
- Overpromise automatic AI capabilities before implementation

## Immediate Next Steps

Recommended next phase:

PHASE 14B — Royal Cosmic Brand / Store Asset Pack

Alternative if Xiaomi is ready:

PHASE 14E — Android Real Device QA

Recommended order:

1. Store release plan
2. Brand/logo/app icon pack
3. Android real-device QA
4. Legal pack
5. Store metadata
6. Google Play internal testing
7. iOS/TestFlight preparation
8. AI layer planning

## Final Result

SalonFlow AI now has a clear professional roadmap from demo/pilot-ready product to Web, Android, Google Play, iOS, and Apple App Store release readiness.
