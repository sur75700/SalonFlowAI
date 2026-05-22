# SalonFlow AI — Product Demo Script

## One-line pitch

SalonFlow AI is a salon operations platform that brings bookings, clients, services, analytics, and reports into one clean admin workspace.

## Problem

Many salons manage appointments, clients, services, and daily reporting across scattered tools, messages, notebooks, and memory.

This creates missed appointments, weak visibility, slow decisions, and no clear picture of revenue performance.

## Solution

SaloFlow AI gives salon operators one control center for daily salon operations.

It helps manage clients, services, appointments, analytics, and reports from one polished interface.

## Demo opening

Today I will show the main operator workflow: login, dashboard, clients, services, appointments, analytics, and reports.

## Demo flow

### 1. Login

Show the login screen and explain that the workspace is protected.

Key point: business analytics and admin data are not public.

### 2. Dashboard

Show the main dashboard as the daily control center.

Explain that the salon owner or manager can quickly understand the operating state.

### 3. Clients

Show the client registry.

Explain that client data becomes organized and searchable instead of being scattered across messages or notebooks.

### 4. Services

Show service catalog management.

Explain that prices, durations, and service availability can be controlled from one place.

### 5. Appointments

Show booking and appointment status flow.

Explain scheduled, completed, and cancelled appointment states.

### 6. Analytics

Show AMD revenue analytics.

Current verified production values:

- completed_revenue: 21050 AMD
- scheduled_pipeline: 53000 AMD
- cancelled_value: 22000 AMD
- avg_completed_booking_value: 7016.67 AMD

Explain that analytics helps salon managers understand real business performance.

### 7. Reports

Show reports area and explain daily summary/export value.

## Security proof

Production analytics is protected.

Without token:

https://salonflowai-backend.onrender.com/analytics/dashboard -> 401 Unauthorized

With valid login token:

/analytics/dashboard -> 200 OK and AMD analytics data

## Android status

Android preview APK has been built through EAS.

Real-device QA is prepared and documented, and will be completed when a clean Android test device is available.

## Close statement

SaloFlow AI is currently release-ready for demo: backend is protected, production Render is verified, mobile build path is prepared, and the main operator workflow is documented.

## Next roadmap

- Android real-device QA
- Optional iOS/TestFlight path
- Production monitoring
- Demo/sales packaging
- First pilot salon onboarding
