# SalonFlow AI — Data Handling Summary

## Status

Draft prepared for store-readiness.

Final legal review recommended before public launch.

## Data Categories

SalonFlow AI may process:

- account/authentication data
- salon business data
- client contact data
- booking/appointment data
- service catalog data
- operational notes
- analytics/report data
- generated PDF report content

## Sensitive Design Notes

SalonFlow AI should avoid collecting unnecessary sensitive data.

The product should not ask for:

- government ID numbers
- payment card data inside the app unless a compliant payment provider is integrated
- health records
- children’s data
- exact geolocation unless explicitly needed in a future feature

## Data Flow

Typical data flow:

1. User logs in.
2. User creates or manages salon data.
3. Backend stores protected operational data.
4. App retrieves data for dashboard, bookings, clients, services, analytics, and reports.
5. PDF reports may be generated from selected operational data.

## Protected Areas

Protected areas include:

- analytics endpoints
- report export endpoints
- authenticated salon operations data

## Current Production Backend

Production backend:

https://salonflowai-backend.onrender.com

## Current Database Direction

MongoDB-based backend storage.

## Public Screenshot Rule

Do not expose:

- tokens
- Authorization headers
- .env values
- private client data
- private phone numbers
- private emails
- generated PDFs with real sensitive data

## Store Data Safety Notes

Store privacy answers must match actual app behavior.

Do not under-report data collection.

Do not claim data is not collected if it is stored or transmitted through backend infrastructure.

## Final Result

SalonFlow AI has a draft data handling summary ready to support privacy policy, store privacy answers, and internal QA.
