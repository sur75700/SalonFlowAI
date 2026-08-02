# Android Version Policy — SalonFlow AI

## Purpose

Define the Android versioning policy before creating production AAB builds for Google Play internal testing or store release.

## EAS Project

- Project: @surnonym19/salonflowai
- Project ID: fbbd9eef-c2cd-4169-a12c-8efb81c654eb

## Current Version State

- App version: 1.0.0
- Android package: com.surnonym19.salonflowai
- EAS appVersionSource: remote
- Latest verified preview APK versionCode: 1
- Latest verified preview APK commit: 75c679dfe81f5e1a17f8373be03968cb8ddfcf04

## Current Build Position

The latest real-device verified Android build is a preview/internal APK, not a production AAB.

Latest verified preview APK:

- Build ID: c7ac0dcf-c7bb-40fe-be26-37319a3b76ab
- APK URL: https://expo.dev/artifacts/eas/qE4ZMNd8whFkg2rX6oMJ5k.apk
- Version: 1.0.0
- Version code: 1

## Policy

Before uploading any production AAB to Google Play:

1. Confirm the app version remains 1.0.0 for the first internal testing release.
2. Let EAS remote app versioning manage Android versionCode unless a store-specific reason requires manual override.
3. Record every production AAB build ID, commit, version, and versionCode.
4. Do not upload multiple AABs with the same versionCode to Google Play.
5. Increment versionCode for each new Google Play upload if the previous AAB has already been uploaded.
6. Keep app.json version and package stable unless intentionally preparing a new public release version.

## Internal Testing Recommendation

For first Google Play internal testing:

- Keep app version: 1.0.0
- Use production profile
- Build Android App Bundle / AAB
- Verify production build commit after completion
- Record production build metadata in release docs

## Pending Before Production AAB

- Confirm whether any production AAB already exists in Google Play Console.
- Confirm tester list.
- Confirm demo/review account strategy if login blocks review.
- Confirm support/legal URLs before public release.
- Confirm native PDF share flow on Android when a device is available.
