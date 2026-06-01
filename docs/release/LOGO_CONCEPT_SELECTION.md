# SalonFlow AI — Logo Concept Selection

## Purpose

Define and compare professional logo concept directions for SalonFlow AI before generating or replacing final app/store assets.

This document supports Phase 14B-2: logo concept selection.

## Status

Logo concept selection prepared.

## Current Rule

Do not replace app icons, splash icons, favicon, or Android adaptive icon files during this phase.

This phase is only for selecting the strongest visual direction.

## Current Asset System

Configured assets:

- mobile/assets/images/icon.png
- mobile/assets/images/android-icon-foreground.png
- mobile/assets/images/android-icon-background.png
- mobile/assets/images/android-icon-monochrome.png
- mobile/assets/images/splash-icon.png
- mobile/assets/images/favicon.png

Current app icon configuration:

- App icon: ./assets/images/icon.png
- Android foreground: ./assets/images/android-icon-foreground.png
- Android background: ./assets/images/android-icon-background.png
- Android monochrome: ./assets/images/android-icon-monochrome.png
- Splash icon: ./assets/images/splash-icon.png
- Favicon: ./assets/images/favicon.png

## Brand Goal

SalonFlow AI should feel like a premium, intelligent command center for modern salons.

The logo must communicate:

- salon operations
- flow
- intelligence
- premium trust
- multilingual SaaS
- calm business control

The logo must work for:

- App Store icon
- Google Play icon
- Android adaptive icon
- iOS icon
- splash screen
- favicon
- web header
- social media preview
- demo videos

## Required Logo Qualities

The selected logo direction must be:

- readable at small sizes
- clean and simple
- premium
- memorable
- not generic
- not overloaded
- compatible with dark and light backgrounds
- safe for rounded app icon masks
- usable without text
- scalable to favicon size

## Concept 1 — Royal Flow Monogram

### Idea

A clean “SF” monogram with a smooth flow curve, deep navy/cosmic background, and subtle royal gold accent.

### Visual Feeling

- premium SaaS
- elegant
- founder-grade
- business command center
- strong app icon identity

### Strengths

- memorable initials
- good for app icon
- works without text
- premium and simple
- can scale well

### Risks

- if too decorative, it may become hard to read
- if “SF” is too abstract, users may not connect it to SalonFlow AI

### App Icon Safety

High.

### Store Readability

High.

### Best For

Final App Store / Google Play identity.

## Concept 2 — Cosmic Salon Command Star

### Idea

A minimal star/spark symbol with a subtle flow line, representing intelligence, clarity, and salon command center energy.

### Visual Feeling

- cosmic
- intelligent
- clean
- optimistic
- premium but friendly

### Strengths

- strong AI/insight feeling
- good for screenshots and marketing
- works well with glow effects
- simple symbol can scale

### Risks

- may look too generic if not combined with a unique flow shape
- must avoid looking like a random sparkle app

### App Icon Safety

High.

### Store Readability

High.

### Best For

Public marketing, Instagram, and premium AI-assisted positioning.

## Concept 3 — Elegant AI Orbit

### Idea

A clean orbit or circular flow around a central mark, suggesting AI-assisted operations and continuous salon workflow.

### Visual Feeling

- intelligent
- futuristic
- calm
- system-oriented
- operational

### Strengths

- communicates AI without robot imagery
- fits “flow” concept
- works well with cosmic visual identity
- premium and modern

### Risks

- orbit logos are common
- must not become too technical or cold

### App Icon Safety

Medium-high.

### Store Readability

High if simplified.

### Best For

AI layer future branding and technology positioning.

## Concept 4 — Premium Calendar Flow

### Idea

A subtle calendar/check/flow mark that represents bookings, scheduling, and daily salon operations.

### Visual Feeling

- practical
- business-focused
- clear
- operational
- trustworthy

### Strengths

- immediately communicates booking/workflow
- easy for salon owners to understand
- strong product relevance

### Risks

- may look less premium or too generic
- may reduce the broader command center / AI feeling

### App Icon Safety

Medium-high.

### Store Readability

High.

### Best For

Users who need instant understanding of the product function.

## Concept 5 — Minimal Crown Flow

### Idea

A very subtle crown-inspired flow mark, not a literal crown, combined with a clean salon operations symbol.

### Visual Feeling

- royal
- luxury
- premium salon energy
- elegant
- confident

### Strengths

- strong luxury/premium feeling
- fits “royal” product direction
- can feel unique if minimal

### Risks

- literal crown can feel childish or too luxury-only
- may distract from SaaS/product clarity
- must avoid looking like a beauty brand only

### App Icon Safety

Medium.

### Store Readability

Medium-high if simplified.

### Best For

Premium/luxury salon positioning.

## Professional Recommendation

Recommended primary direction:

Concept 1 — Royal Flow Monogram

Recommended secondary influence:

Concept 2 — Cosmic Salon Command Star

Final direction should combine:

- SF monogram or abstract SalonFlow mark
- subtle flow curve
- deep navy/cosmic background
- royal gold accent
- optional soft cyan AI glow
- no tiny text
- no scissors
- no robots
- no clutter

## Selected Direction

Current selected direction:

Royal Flow Monogram with subtle Cosmic Command Star influence.

Decision:

Use a clean, premium, scalable symbol that can work as an app icon first and marketing logo second.

## Master Logo Prompt

Create a premium app logo for “SalonFlow AI”, a modern salon operations platform. The logo should feel royal, cosmic, elegant, clean, trustworthy, and intelligent. Use a deep navy or cosmic black background with subtle royal gold accents and a soft cyan AI glow. The symbol should be simple and scalable for App Store and Google Play icons. Use an abstract “SF” monogram or a unique flow mark with a subtle command-center spark. The icon must be readable at small sizes, with strong contrast and safe margins. Avoid tiny text, scissors, combs, robots, clutter, generic chatbot imagery, and overly detailed neon cyberpunk effects.

## Alternative Prompt — Minimal Icon

Design a minimal premium mobile app icon for SalonFlow AI. Create a clean abstract symbol combining salon flow, business command center, and AI intelligence. Use deep navy, royal gold, and a subtle cyan glow. The icon should be simple, elegant, readable at 48px, and suitable for iOS and Android adaptive icons. No text, no scissors, no robots, no clutter.

## Alternative Prompt — Marketing Logo

Create a refined brand logo for SalonFlow AI, a multilingual salon operations SaaS platform. The style should be premium, royal, modern, and cosmic. Include a simple scalable mark and optional wordmark. The mark should suggest flow, organization, intelligence, and daily business control. Use deep navy, gold, and soft cyan. Keep it clean, professional, and store-ready.

## Asset Generation Rules

When generating final assets:

1. Generate 3-5 visual candidates.
2. Test at small sizes.
3. Choose one direction.
4. Create 1024x1024 base icon.
5. Create Android adaptive foreground/background.
6. Create monochrome Android icon.
7. Create splash icon.
8. Create favicon.
9. Verify all assets locally.
10. Commit asset replacement separately.

## What Not To Do

Do not:

- replace current production icons in this phase
- commit random generated images
- use text inside app icon
- use scissors/comb as the main mark
- use robot imagery
- use fake App Store / Google Play badges
- use tiny details that disappear at small size
- use low-contrast gold on white
- delete React default assets until references are checked

## Safety Gate Before Asset Replacement

Before replacing image files, run:

- Check current asset dimensions
- Back up current asset files
- Generate final export sizes
- Verify app.json paths
- Run npm run typecheck
- Run npx expo-doctor
- Open Expo web
- Check splash/icon visually
- Commit asset replacement separately

## Phase 14B-2 Completion Criteria

Phase 14B-2 is complete when:

- logo concept directions are documented
- recommended direction is selected
- logo prompts are prepared
- asset generation rules are defined
- image replacement safety gate is defined
- git status is clean

## Next Phase

Phase 14B-3 — Final Logo / App Icon Asset Generation

Goal:

Generate or design final logo/icon candidates based on the selected Royal Flow Monogram + Cosmic Command Star direction.

## Final Result

SalonFlow AI has a selected professional logo direction and prompt system ready for final asset generation.
