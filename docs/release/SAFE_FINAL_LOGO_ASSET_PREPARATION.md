# SalonFlow AI — Safe Final Logo Asset Preparation

## Purpose

Prepare the safe production asset workflow for converting the selected final logo concept into App Store, Google Play, Android, iOS, splash, favicon, and web-ready assets.

This document supports Phase 14B-4.

## Status

Safe final logo asset preparation ready.

## Selected Logo Direction

Concept 1 — Royal Flow Monogram.

Direction:

- abstract SF monogram
- cosmic orbit
- royal gold
- deep navy / cosmic black
- soft cyan glow
- premium salon operations command-center identity

## Important Rule

The selected Concept 1 presentation image is a direction reference, not yet a production asset.

Do not directly use the full presentation board as the app icon.

Production assets must be isolated, square, clean, and exported at the correct sizes.

## Target Production Assets

Final assets to prepare:

- mobile/assets/images/icon.png
- mobile/assets/images/android-icon-foreground.png
- mobile/assets/images/android-icon-background.png
- mobile/assets/images/android-icon-monochrome.png
- mobile/assets/images/splash-icon.png
- mobile/assets/images/favicon.png

## Current Asset Paths

Configured in mobile/app.json:

- App icon: ./assets/images/icon.png
- Android foreground: ./assets/images/android-icon-foreground.png
- Android background: ./assets/images/android-icon-background.png
- Android monochrome: ./assets/images/android-icon-monochrome.png
- Splash icon: ./assets/images/splash-icon.png
- Favicon: ./assets/images/favicon.png

## Required Export Sizes

### Base App Icon

File:

mobile/assets/images/icon.png

Required:

- 1024x1024
- PNG
- no transparency for iOS safety
- no text
- centered logo mark
- safe margins
- readable at small sizes

### Android Adaptive Foreground

File:

mobile/assets/images/android-icon-foreground.png

Required:

- PNG
- transparent background
- centered SF/flow mark
- safe zone respected
- no details near edges
- strong silhouette

### Android Adaptive Background

File:

mobile/assets/images/android-icon-background.png

Required:

- PNG
- deep navy / cosmic black
- subtle gradient or glow
- no busy stars
- no text
- no important details

### Android Monochrome

File:

mobile/assets/images/android-icon-monochrome.png

Required:

- one-color simplified mark
- no gradients
- no tiny details
- readable as mask/monochrome icon

### Splash Icon

File:

mobile/assets/images/splash-icon.png

Required:

- 1024x1024
- centered mark
- calm premium feeling
- minimal
- consistent with app icon

### Favicon

File:

mobile/assets/images/favicon.png

Required:

- 48x48 final output
- simplified symbol
- high contrast
- no text
- readable at browser tab size

## Asset Preparation Workflow

1. Keep the current assets untouched.
2. Generate isolated Concept 1 logo candidate.
3. Export a clean square 1024x1024 app icon.
4. Export Android adaptive foreground, background, and monochrome assets.
5. Export splash icon.
6. Export favicon.
7. Verify dimensions using file or identify.
8. Replace assets only after approval.
9. Run TypeScript check.
10. Run Expo Doctor.
11. Start Expo web and visually inspect.
12. Commit asset replacement separately.
13. Tag the asset replacement milestone.

## Safety Backup Command

Before replacing assets, create a backup folder and copy current asset files.

Do not commit backup files unless intentionally needed.

Backup command:

mkdir -p mobile/assets/images_backup_before_14b4
cp mobile/assets/images/icon.png mobile/assets/images_backup_before_14b4/
cp mobile/assets/images/android-icon-foreground.png mobile/assets/images_backup_before_14b4/
cp mobile/assets/images/android-icon-background.png mobile/assets/images_backup_before_14b4/
cp mobile/assets/images/android-icon-monochrome.png mobile/assets/images_backup_before_14b4/
cp mobile/assets/images/splash-icon.png mobile/assets/images_backup_before_14b4/
cp mobile/assets/images/favicon.png mobile/assets/images_backup_before_14b4/

## Verification Commands After Replacement

Run:

cd ~/Projects/SalonFlowAI/mobile || exit 1
npm run typecheck
npx expo-doctor

cd ~/Projects/SalonFlowAI/backend || exit 1
python -m compileall app

Dimension check:

cd ~/Projects/SalonFlowAI || exit 1
file mobile/assets/images/icon.png
file mobile/assets/images/android-icon-foreground.png
file mobile/assets/images/android-icon-background.png
file mobile/assets/images/android-icon-monochrome.png
file mobile/assets/images/splash-icon.png
file mobile/assets/images/favicon.png

## What Not To Do

Do not:

- use presentation board as app icon
- replace files without backup
- commit unverified generated images
- change app.json paths unless needed
- delete React default assets in this phase
- change auth/backend logic
- change package versions
- claim App Store / Google Play availability before actual release

## Phase 14B-4 Completion Criteria

Phase 14B-4 preparation is complete when:

- selected logo asset workflow is documented
- target files are listed
- export requirements are defined
- backup command is defined
- verification commands are defined
- replacement safety rules are clear
- git status is clean

## Next Phase

Phase 14B-4B — Generate isolated production logo assets.

Goal:

Create the actual isolated Concept 1 production-ready files and prepare them for safe replacement.

## Final Result

SalonFlow AI has a safe asset preparation workflow for converting the selected Concept 1 logo into production-ready mobile and store assets.
