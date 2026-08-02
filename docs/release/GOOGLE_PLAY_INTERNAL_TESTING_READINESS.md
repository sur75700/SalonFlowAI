# Google Play Internal Testing Readiness — SalonFlow AI

## Purpose

Prepare SalonFlow AI for Google Play internal testing after the final Android mobile polish milestone.

This document is for internal testing preparation, not final public launch submission.

## Current Branch State

- Branch: phase-7-royal-hardening
- Main contains final Android mobile polish milestone
- Android real-device QA passed
- Final mobile polish accepted
- Production backend URL configured for native builds

## Android App Identity

- App name: SalonFlow AI
- Android package: com.surnonym19.salonflowai
- App version: 1.0.0
- EAS app version source: remote

## Build Profiles

Preview:

- Profile: preview
- Format: APK
- Distribution: internal
- Purpose: real-device QA and manual install testing

Production:

- Profile: production
- Format: Android App Bundle / AAB
- Purpose: Google Play internal testing and store release pipeline

## Production Environment

Production Android builds use:

- EXPO_PUBLIC_API_URL=https://salonflowai-backend.onrender.com

## Verified Before Internal Testing

Completed:

- Android preview APK build succeeded
- Real Android device install/open passed
- App works independently from local laptop
- Production backend connectivity passed
- Restore Session/auth flow passed
- Dashboard passed
- Clients passed
- Services passed
- Bookings passed
- Reports screen opens
- Mobile bottom navigation polished
- Dashboard quick actions stabilized
- Booking cards compacted
- Native PDF export sharing implementation added

## Remaining Before Uploading AAB To Google Play Internal Testing

Required:

- Confirm EAS remote versionCode policy before production build
- Build production AAB from a clean branch
- Verify production AAB build commit
- Prepare tester list
- Prepare demo/review account strategy if required
- Ensure screenshots use safe demo data only
- Confirm native PDF share flow on Android when device is available
- Complete Google Play Data safety answers before public release
- Do not submit public production release while support/legal URLs are still TBD

## Safe Testing Position

SalonFlow AI is ready for:

- internal Android testing
- pilot testing
- closed/manual QA
- Google Play internal testing preparation

SalonFlow AI is not yet ready for public store launch until:

- support email is finalized
- privacy policy URL is finalized
- terms URL is finalized
- data deletion process is finalized
- final screenshots are prepared
- Google Play Data safety answers are completed

## Next Technical Command

When the branch is clean and versionCode policy is confirmed, create production AAB from mobile folder with:

npx eas-cli build --platform android --profile production
