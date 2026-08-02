# Phase 22E — Executive Isolation Architecture Plan

## Goal

Reduce visible complexity for normal salon users while preserving the internal executive command layer for founder/admin workflows.

## Current Problem

The Settings screen currently contains both customer-facing settings and internal executive controls. This creates long scrolling, cognitive load, and weaker product clarity.

## Visibility Layers

### Public Salon Mode

Visible to normal salon users:
- Account overview
- Workspace brand basics
- Subscription status
- Basic navigation
- Support notes

### Executive Mode

Visible to owner/admin users:
- Executive Command Dashboard
- Billing Center
- Subscription Sync Center
- Team Roles Center
- Enterprise Security Center
- Integration Center
- AI Usage Analytics Center
- Audit Logs Center
- Notification Preferences Center

### Super Admin / Internal Mode

Future internal-only layer:
- System diagnostics
- Feature flags
- Internal health
- Migration tools
- Debug telemetry

## Recommended Implementation

1. Add a lightweight visibility flag:
   - `const EXECUTIVE_MODE_ENABLED = true;`
   - Later replace with role/feature flag.

2. Keep current components unchanged.
3. Wrap executive-only modules behind the flag.
4. Keep public Settings clean and short.
5. Move future internal tools into a dedicated internal control layer.

## Product Psychology

Normal users should see simplicity and confidence.
Admins should see control and power.
Developers/founders should keep hidden operational depth.

## Risk Control

- Do not delete existing components.
- Do not rename routes.
- Do not change i18n keys.
- First phase only isolates visibility.
- Later phase can split screens/routes if needed.

## Phase 22E Deliverable

A safe visibility-isolation layer in `explore.tsx` that separates public settings from executive controls without removing functionality.
