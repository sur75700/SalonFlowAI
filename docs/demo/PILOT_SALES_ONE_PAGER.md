# SalonFlow AI — Pilot Sales One-Pager

## Short Positioning

SalonFlow AI is a salon operations control system for owners who want cleaner booking management, organized client records, service catalog control, business analytics, and daily reporting in one workspace.

## Who It Is For

- Salon owners
- Beauty studios
- Barbershops
- Appointment-based service businesses
- Teams that currently manage operations through messages, notebooks, spreadsheets, or scattered tools

## Core Problem

Many salons lose time and visibility because daily operations are spread across different places.

Common issues:

- Booking confusion
- No clean client history
- Service prices and durations are not centralized
- Owners cannot quickly see completed revenue, scheduled pipeline, or cancelled value
- Reports are manual or missing

## SalonFlow AI Solution

SalonFlow AI gives the salon one admin workspace for daily business control.

The platform includes:

- Dashboard
- Clients
- Services
- Appointments
- Analytics
- Reports
- Protected admin login

## Demo Proof Points

During the demo, show:

1. Login and protected workspace
2. Dashboard overview
3. Client registry
4. Service catalog with pricing and durations
5. Appointment status workflow
6. Analytics with AMD business numbers
7. Reports area
8. Security proof: analytics returns 401 without token

## Current Verified Production State

- Production backend health works
- Production analytics is protected
- Android preview APK has been built
- Release documentation is synced
- Android real-device QA is prepared

Verified production analytics behavior:

- /healthz -> 200 OK
- /analytics/dashboard without token -> 401 Unauthorized
- /analytics/dashboard with token -> 200 OK and AMD analytics data

## Pilot Offer

Pilot setup for one salon includes:

- Product walkthrough
- Basic salon workflow setup
- Client/service/appointment demo data review
- Owner/operator training session
- Feedback collection for next improvement cycle

## Pilot Goal

The goal of the pilot is to prove that SalonFlow AI can help the salon owner see daily operations more clearly and manage the business from one clean system.

## Suggested Call To Action

Book a short demo and see how SalonFlow AI can organize your salon workflow.

## Simple Closing Line

If your salon is still managing bookings, clients, services, and reports across scattered tools, SalonFlow AI can give you one clean control center.
