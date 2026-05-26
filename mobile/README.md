# SalonFlow AI Mobile

SalonFlow AI Mobile is the Expo / React Native client for the SalonFlowAI salon appointment, CRM, booking, analytics, and reporting platform.

## Stack

- Expo SDK 54
- React Native
- Expo Router
- TypeScript
- Axios
- React Native Gifted Charts
- FastAPI backend
- MongoDB database
- EAS Build

## App Identity

Name: SalonFlow AI
Slug: salonflowai
Scheme: salonflowai
Android package: com.surnonym19.salonflowai

## Environment

Local .env should contain:

EXPO_PUBLIC_API_URL=https://salonflowai-backend.onrender.com

The app reads EXPO_PUBLIC_API_URL first. If it is missing, the app falls back to local development URLs from app.json.

## Install

Run from the mobile directory:

npm install

## Type Check

npm run typecheck

## Expo Doctor

npx expo-doctor

Expected result:

17/17 checks passed.

## Start Development Server

npx expo start -c

Web runtime:

http://localhost:8081

## Main Screens

- Dashboard
- Clients
- Services
- Appointments
- Analytics
- Reports

## Backend Expectations

Local backend:

http://127.0.0.1:8000

Expected checks:

curl -i http://127.0.0.1:8000/healthz
curl -i http://127.0.0.1:8000/analytics/dashboard

Expected results:

/healthz -> 200 OK
/analytics/dashboard without token -> 401 Unauthorized

The 401 response is correct because analytics is protected.

## Android Preview Build

Android preview APK has been built through EAS.

Build profile: preview
Distribution: internal
Android package: com.surnonym19.salonflowai

## QA Checklist

- Login
- Dashboard
- Clients
- Services
- Appointments
- Analytics AMD numbers
- Reports
- Logout/Login

## Release Safety Rules

- Do not commit .env
- Do not commit node_modules
- Do not commit .expo
- Do not commit generated PDF reports
- Run npm run typecheck before mobile commits
- Run npx expo-doctor before release or mobile config commits
- Keep backend analytics protected
