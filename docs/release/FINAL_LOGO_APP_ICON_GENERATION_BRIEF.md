# SalonFlow AI — Final Logo / App Icon Generation Brief

## Purpose

Define the final art direction, prompts, constraints, and approval criteria for generating SalonFlow AI logo and app icon candidates.

This document supports Phase 14B-3A.

## Status

Final logo / app icon generation brief prepared.

## Current Rule

Do not replace production image assets in this phase.

This phase prepares the final generation brief only.

## Selected Logo Direction

Selected direction:

Royal Flow Monogram with subtle Cosmic Command Star influence.

Core idea:

A premium, clean, scalable symbol for SalonFlow AI that combines:

- an abstract SF monogram or SalonFlow mark
- a smooth flow curve
- deep navy / cosmic black
- royal gold accent
- subtle soft cyan AI glow
- minimal command-center spark
- store-safe icon readability

## Brand Feeling

The final logo should feel:

- premium
- royal
- cosmic
- elegant
- clean
- intelligent
- calm
- trustworthy
- modern SaaS
- salon operations focused
- AI-assisted without looking like a robot app

## Primary Use Cases

The selected logo must work for:

- iOS app icon
- Android app icon
- Android adaptive foreground
- Android adaptive background
- Android monochrome icon
- splash screen
- favicon
- web header
- social media story / post
- App Store screenshots
- Google Play feature graphic
- demo videos

## Current Asset Targets

Current files that may later be replaced:

- mobile/assets/images/icon.png
- mobile/assets/images/android-icon-foreground.png
- mobile/assets/images/android-icon-background.png
- mobile/assets/images/android-icon-monochrome.png
- mobile/assets/images/splash-icon.png
- mobile/assets/images/favicon.png

Do not replace these files until final candidate approval.

## Master Generation Prompt

Create a premium mobile app logo for “SalonFlow AI”, a modern salon operations platform for bookings, clients, services, analytics, and reports. The logo should feel royal, cosmic, elegant, clean, trustworthy, intelligent, and store-ready. Use a deep navy or cosmic black background with subtle royal gold accents and a soft cyan AI glow. Create a simple scalable symbol based on an abstract “SF” monogram or unique SalonFlow flow mark, with a subtle command-center spark. The icon must be readable at small sizes, work without text, have strong contrast, safe margins, and be suitable for App Store and Google Play. Avoid tiny text, scissors, combs, robots, chatbot imagery, clutter, and overly detailed neon cyberpunk effects.

## App Icon Prompt

Design a premium 1024x1024 app icon for SalonFlow AI. Create a clean abstract symbol combining “SF”, salon flow, business command center, and AI intelligence. Use deep navy/cosmic black, royal gold, and a subtle cyan glow. The icon must be minimal, readable at 48px, centered, high contrast, and safe for rounded iOS icon masks. No text, no scissors, no combs, no robots, no clutter.

## Android Adaptive Icon Prompt

Create Android adaptive icon assets for SalonFlow AI.

Foreground:

A centered premium abstract SF/flow mark in royal gold with subtle cyan highlight. Transparent background, strong silhouette, safe zone respected, no text.

Background:

Deep navy/cosmic black background with very subtle radial glow or smooth gradient. No busy details.

Monochrome:

A simplified one-color version of the SF/flow mark, readable at small sizes, no gradients, no tiny details.

## Splash Icon Prompt

Create a clean splash icon for SalonFlow AI using the selected Royal Flow Monogram direction. The mark should be centered, calm, premium, and minimal. Use the same SF/flow identity with royal gold and optional cyan glow. Avoid text unless absolutely necessary. The splash should feel fast, elegant, and not overloaded.

## Favicon Prompt

Create a simple favicon symbol for SalonFlow AI based on the selected app icon. It must remain readable at 48x48 and smaller. Use a simplified SF/flow mark with high contrast. No text, no gradients that disappear at small size, no tiny details.

## Marketing Logo Prompt

Create a refined horizontal brand logo for SalonFlow AI, a multilingual salon operations SaaS platform. Include a simple scalable mark and a clean wordmark. The style should be premium, royal, modern, cosmic, and professional. The mark should suggest flow, organization, intelligence, and daily salon business control. Use deep navy, royal gold, and soft cyan accents. Keep it clean and store-ready.

## Negative Prompt

Avoid:

- tiny text
- unreadable letters
- scissors
- combs
- hairdryer icons
- robot faces
- chatbot bubbles
- excessive neon cyberpunk style
- overly detailed galaxy backgrounds
- too much gold
- low contrast
- crowded symbols
- fake Apple or Google badges
- app store badges inside the icon
- realistic beauty salon tools
- generic sparkle-only logo
- thin lines that disappear at 48px

## Candidate Requirements

Generate 3-5 candidates.

Each candidate should be evaluated by:

- small-size readability
- app icon strength
- uniqueness
- premium feeling
- SalonFlow relevance
- AI/command-center subtlety
- store safety
- visual simplicity
- compatibility with splash and favicon
- dark/light background behavior

## Scorecard

Use this scorecard.

| Criterion | Score 1-5 | Notes |
|---|---:|---|
| Small-size readability |  |  |
| App icon safety |  |  |
| Premium feeling |  |  |
| Unique identity |  |  |
| SalonFlow relevance |  |  |
| AI/command-center subtlety |  |  |
| Store readiness |  |  |
| Splash/fav compatibility |  |  |
| Overall recommendation |  |  |

## Approval Criteria

A logo candidate can be approved only if:

- it is readable at small size
- it works without text
- it has a strong silhouette
- it feels premium and professional
- it does not look generic
- it does not rely on scissors/combs/robots
- it can become Android adaptive icon assets
- it can become an iOS icon
- it can become splash and favicon
- it matches SalonFlow AI’s royal/cosmic/SaaS identity

## Asset Export Checklist

After final candidate selection, export:

- icon.png — 1024x1024
- android-icon-foreground.png — adaptive foreground
- android-icon-background.png — adaptive background
- android-icon-monochrome.png — monochrome mark
- splash-icon.png — 1024x1024
- favicon.png — 48x48 or generated from higher source
- optional marketing logo
- optional store feature graphic source

## Replacement Safety Gate

Before replacing production assets:

1. Confirm selected logo candidate.
2. Back up current assets.
3. Confirm dimensions.
4. Confirm transparency rules.
5. Confirm app.json paths.
6. Replace assets in one controlled commit.
7. Run npm run typecheck.
8. Run npx expo-doctor.
9. Start Expo web.
10. Visually check app icon/splash/fav where possible.
11. Commit asset replacement separately.
12. Tag the asset replacement milestone.

## What Not To Do

Do not:

- replace assets in this phase
- delete React default assets in this phase
- commit generated images without approval
- use unverified dimensions
- change app.json paths without need
- change package versions
- change auth/backend logic
- make store availability claims before actual release

## Recommended Next Phase

Phase 14B-3B — Generate 3-5 Logo Candidates

Goal:

Generate visual candidates based on this brief and select the strongest direction before any asset replacement.

## Final Result

SalonFlow AI has a final logo and app icon generation brief ready for controlled candidate generation.
