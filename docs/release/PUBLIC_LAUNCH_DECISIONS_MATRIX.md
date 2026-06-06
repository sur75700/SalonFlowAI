# SalonFlow AI — Public Launch Decisions Matrix

## Purpose

Track the final owner decisions required before public App Store, Google Play, or public web launch.

This document separates completed engineering readiness from public-release business/legal decisions.

## Current Engineering State

Completed:

- Android real-device QA passed
- Final mobile polish accepted
- Production backend connectivity confirmed
- Main branch contains final Android-tested milestone
- EAS preview APK profile exists
- EAS production Android App Bundle profile exists
- Native PDF export sharing implementation exists
- Store metadata drafts exist
- Legal pack drafts exist

## Public Launch Decisions Still Required

| Area | Decision Needed | Status | Blocking For Public Store? |
|---|---|---:|---:|
| Support email | Official public support/contact email | Pending owner decision | Yes |
| Privacy policy URL | Public URL where privacy policy will be hosted | Pending owner decision | Yes |
| Terms URL | Public URL where terms will be hosted | Pending owner decision | Yes |
| Data deletion | Clear deletion/correction request process | Pending owner decision | Yes |
| Store support URL | Public support page or contact URL | Pending owner decision | Yes |
| Marketing URL | Public landing page / website URL if used | Pending owner decision | Recommended |
| Demo account | Review/demo login strategy without exposing secrets | Pending owner decision | Yes if login blocks review |
| Screenshots | Final clean screenshots from real/demo data | Pending asset capture | Yes |
| Native PDF share QA | Final Android manual share-sheet confirmation | Pending device confirmation | Recommended before release |
| Version policy | Confirm versionName/versionCode release policy | Pending release decision | Yes for store release |

## Safe Current Position

SalonFlow AI is currently:

- demo-ready
- pilot-ready
- internal-test ready
- Android preview APK ready
- store-preparation ready

SalonFlow AI is not yet public-store-submission ready until the required public launch decisions above are finalized.

## Do Not Do Yet

Do not:

- publish placeholder support/contact fields
- submit store listing with TBD URLs
- publish demo credentials in Git
- claim public store availability before actual release
- overclaim AI automation features before implementation
- use private client data in screenshots

## Recommended Next Order

1. Decide official support email.
2. Decide privacy policy and terms hosting location.
3. Define data deletion request process.
4. Prepare demo/review account strategy.
5. Capture final screenshots using safe demo data.
6. Confirm native PDF share flow on Android.
7. Build production AAB for Google Play internal testing.
8. Complete Google Play Data safety answers.
9. Prepare Phase 15 AI Intelligence Core after release-readiness gates.
