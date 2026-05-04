# Multi-Language Architecture

## Goal

SalonFlowAI should support:
- English
- Armenian
- Russian
- French

## Language Strategy

### Source Of Truth
English (`en`) is the base language.

### Additional Languages
- Armenian (`hy`)
- Russian (`ru`)
- French (`fr`)

## Current Architecture

- `lib/i18n.ts` -> language definitions
- `translations/en.ts` -> English strings
- `translations/hy.ts` -> Armenian strings
- `translations/ru.ts` -> Russian strings
- `translations/fr.ts` -> French strings
- `translations/index.ts` -> unified export
- `hooks/useLanguage.ts` -> hook for current language access

## Next Step

The next phase is to connect these translation keys into the admin UI:
- navigation
- auth/session
- dashboard
- bookings
- clients
- services
- insights
- reports
- workspace\n