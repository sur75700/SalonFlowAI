# SalonFlowAI

SalonFlowAI is a salon operations platform that unifies bookings, client management, service catalog control, business insights, and PDF reporting into one polished admin workspace.

## Overview

SalonFlowAI is built to help salon businesses move away from scattered tools, manual coordination, and weak reporting. The platform provides a central control layer for daily salon operations and management visibility.

## Core Features

- Executive dashboard with operating metrics
- Booking management and appointment status flow
- Client registry with search and edit support
- Service catalog with pricing, duration, and activation controls
- Insights dashboard with revenue and performance visibility
- PDF daily summary export flow
- Workspace tab with operator shortcuts and backend access

## Current Admin Screens

- Dashboard
- Bookings Control
- Client Registry
- Service Catalog
- Insights
- PDF Reports
- Workspace

## Tech Stack

### Frontend
- Expo
- React Native
- Expo Router
- TypeScript

### Backend
- FastAPI
- Python
- MongoDB
- REST API
- JWT authentication

## Project Structure

SalonFlowAI/
- backend/
- mobile/
- docs/
- README.md

## Deployment Status

- Frontend is prepared and uploaded
- Backend is prepared and uploaded
- Production backend health is working
- Production login is working
- Core admin navigation is working
- UI wording polish is complete
- PDF export GET flow is working
- Demo path is ready

## Production Backend

https://salonflowai-backend.onrender.com

## Production Health

https://salonflowai-backend.onrender.com/healthz

## Main Product Flow

1. Open Dashboard
2. Review executive metrics
3. Open Bookings Control
4. Open Client Registry
5. Open Service Catalog
6. Open Insights
7. Open PDF Reports
8. Open Workspace

## Docs

The docs/ directory includes:
- release checklist
- runbook
- demo script
- investor pitch
- demo talking points
- one-minute pitch

## Notes

- PDF export route supports GET download flow
- HEAD may return 405 while GET still works correctly
- Workspace replaces the default Expo starter Explore page

## Goal

SalonFlowAI is designed to become a powerful salon admin operating system with better visibility, cleaner workflows, and scalable business control.
