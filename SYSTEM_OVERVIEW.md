# Pentecost Convention Centre Visitor Management System (PCC VMS) — Comprehensive System Overview

> **Version:** 0.1.0  
> **Stack:** Next.js 16.3.1 (App Router & Turbopack) · React 19 · PostgreSQL (Neon Serverless) · NextAuth.js · Tailwind CSS v4 · shadcn/ui

---

## 1. Executive Summary

The **Pentecost Convention Centre Visitor Management System (PCC VMS)** is an enterprise-grade digital platform designed to govern and streamline physical visitor access control across the Pentecost Convention Centre (PCC) campus. 

The system transitions the centre away from manual paper logbooks into an automated, real-time ecosystem providing:
- **Guard-Operated Gate Registration & Immediate Authorization:** Guards take visitor details, verify the host, and register visitors directly at the gate. Check-in is authorized instantly without self-service queues. Features Ghana-standard phone formatting, real-time watchlist screening, returning visitor detection, and voice input.
- **Dedicated Guard Station Portal (`/guard`)** engineered with outdoor high-contrast sunlight mode, one-tap mobile ergonomics, audio feedback, overstay alerts, in-station manual walk-ins, and direct on-site headcount review.
- **Dedicated Check-Out Terminal (`/check-out`)** supporting camera-based QR code scanning, manual code entry, and live on-site directory selection.
- **Administrative Incident Command & Operations Centre (`/admin/*`)** featuring real-time KPI dashboards, emergency evacuation roll-call rosters with print & CSV export, shift handover logs, security incident reporting, vehicles tracking, watchlist enforcement, staff directory, customizable visitor categories, and audit logging.

---

## 2. Architecture & Technology Stack

```
flowchart TD
    subgraph Clients["Access Interfaces"]
        Kiosk["Public Kiosk / Mobile\n(/, /register, /pdf)"]
        Guard["Guard Portal (Mobile-first)\n(/guard, /check-out)"]
        Admin["Admin Management Panel\n(/admin/*)"]
    end

    subgraph AppLayer["Next.js Application Core"]
        Auth["NextAuth.js\n(Credentials, BCrypt, RBAC)"]
        Routes["Route Handlers (50+ APIs)\n(/api/*)"]
        UI["React 19 Components\n(Tailwind CSS v4 + shadcn/ui)"]
    end

    subgraph DataLayer["Persistence & Real-time Sync"]
        NeonDB[("PostgreSQL\n(Neon Serverless via @neondatabase/serverless)")]
        Audio["Web Audio API\n(Gate Chimes)"]
        Scanner["HTML5-QRCode\n(Camera Scanner)"]
    end

    Kiosk --> UI
    Guard --> UI
    Admin --> UI
    UI --> Routes
    Routes --> Auth
    Routes --> NeonDB
    Guard --> Audio
    Guard --> Scanner
```

### Core Technologies
- **Framework:** Next.js 16.3.1 utilizing App Router, Server Components, and Turbopack.
- **Frontend / Styling:** React 19, Tailwind CSS v4, Lucide React icons, shadcn/ui.
- **Authentication & RBAC:** NextAuth.js (v4) with credentials provider, session callbacks, and role-based access control.
- **Database:** PostgreSQL hosted on Neon Serverless, managed with tagged SQL queries and parameterization.
- **Hardware Integrations:** Web Speech API (Voice dictation), HTML5-QRCode (Device camera QR scanning), Web Audio API (Synthesized acoustic chimes).

---

## 3. Role-Based Access Control (RBAC)

The system enforces strict permission boundaries defined in `src/lib/rbac.ts`:

| Role | Hierarchy Level | Primary Operational Scope | Portal Access |
|---|---|---|---|
| `security_officer` | 1 | Front gate security guards executing visitor arrivals, departures, walk-in authorizations, and on-site headcount checks. | Guard Portal (`/guard`), Check-Out (`/check-out`), Registration (`/register`) |
| `supervisor` | 2 | Shift leads managing guard operations, shift changeovers, security incident reporting, and routine reports. | Guard Portal + Admin Pages (Incidents, Shift Handover, Watchlist view, Reports) |
| `sector_head` | 3 | Departmental leadership overseeing facility security, audit trails, user account governance, and system configurations. | All Admin Pages + User Management & System Settings |
| `admin` | 4 | System administrators managing infrastructure, security permissions, database configurations, and overall operations. | Admin Dashboard (`/admin/*`). *Restricted from Guard Portal to maintain station separation.* |

---

## 4. Portals & User Interface Breakdown

### 4.1 Gate Entrance & Registration Interface

#### 1. Entrance Welcome Screen (`/`)
- **Interactive Information Carousel:** Showcases the Pentecost Convention Centre facilities, visitor guidelines, and campus notices.
- **Primary Calls to Action:**
  - **Register Visitor:** Opens the gate arrival registration interface (used by on-duty guards).
  - **View Information:** Opens the PCC Information Document viewer (`/pdf`).
- **Contextual Redirects:** Automatically routes authenticated guards to `/guard` and administrators to `/admin/dashboard`.

#### 2. Multi-Step Gate Registration (`/register`)
- **Step 1: Visitor Identity**
  - Full Name with hands-free voice input via Web Speech API.
  - Contact Phone with Ghana telephone auto-formatting (`+233 XX XXX XXXX`).
  - Visitor Type selection (Official, Personal, Contractor, Guest, Delivery, VIP, Other).
  - Organisation/Company Name.
  - Optional Identification Details (Ghana Card, Passport, Voter ID, Driver's Licence).
- **Step 2: Visit Target & Vehicle Details**
  - Host / Staff member being visited.
  - Department dropdown (Administration, Security & Safety, Guest House / Hospitality, Events & Conferences, Finance, Maintenance / Estate, Executive Office).
  - Purpose of visit with 1-tap quick presets (Official Meeting, Event / Conference, Guest House Check-in, Contractor / Service, Delivery / Courier, Personal Visit).
  - Vehicle Registration Number (auto-uppercased).
- **Step 3: Verification & Summary**
  - Complete pre-submission review sheet.
- **Real-Time Security Intelligence:**
  - **Duplicate Detection:** Automatic verification prevents duplicate active badges for visitors already checked in.
  - **Watchlist Screening:** Screened against the security watchlist to alert officers of flagged individuals.
  - **Returning Visitor Recognition:** Displays past visit history count and last visit dates.
  - **Instant Check-In Authorization:** Upon form submission, visitors are immediately authorized (`APPROVED`), checked in (`CHECKED_IN`), assigned a pass number, and logged into the campus log.
- **Smart Navigation:** The "Back" action dynamically returns guards to `/guard`, admins to `/admin/dashboard`, or public guests to `/`.

#### 3. Access Confirmation & Digital Pass (`/register/success`)
- Displays an **Active Access Pass** with visitor pass code and check-in timestamp.
- Displays a high-resolution QR code encoding the visitor pass for checkout scanning at departure.
- Provides direct links to the departure terminal.

#### 4. PCC Information Document Viewer (`/pdf`)
- Serves official campus rules, guidance, and venue maps.
- Features high-resolution preview and one-click download.

---

### 4.2 Guard Station Terminal (`/guard`)

A purpose-built, responsive interface optimized for smartphones, tablets, and ruggedized gate terminals:

- **Station Header & Ergonomics:**
  - Real-time station clock and date indicator.
  - Shift badge (auto-detects Day Shift `06:00 – 18:00` vs. Night Shift `18:00 – 06:00`).
  - **Outdoor Sunlight Mode:** High-contrast color scheme for outdoor visibility under direct sunlight.
  - **Audio Chime Toggle:** Synthesized audio feedback confirming authorizations and warnings.
  - Guard profile chip with shift details and end-shift sign-out action.
- **Primary Operational Cards:**
  - **Check In:** Direct link to registration with guard context.
  - **Check Out:** Instant access to departure logging.
- **Quick Station Actions:**
  - **Manual Walk-in Button:** Opens an in-portal modal form for guard-assisted entry registration.
  - **On-Site Count Button:** Displays the live number of visitors currently checked in.
- **Live On-Site Visitor Drawer:**
  - Searchable list of all active visitors on campus.
  - Filterable by name, pass number, vehicle plate, host, or organization.
  - Displays check-in time and host contact.
  - Includes a **Print List** button for roll-call sheets and a 1-tap **Checkout** button per visitor card.
- **Overstay Alerts Card:**
  - Flags visitors remaining on campus for over 4 hours.
  - Displays elapsed minutes and provides direct check-out action buttons.
- **Station Safety & Isolation:**
  - Does not navigate guards away to administrative screens during roll calls.

---

### 4.3 Check-Out & Departure Terminal (`/check-out`)

- **Multi-Method Departure Verification:**
  - **QR Code Scanning:** Activates device camera via `html5-qrcode` to scan digital passes or printed badges.
  - **Manual Code Entry:** Numeric/alphanumeric search for pass numbers or registration codes.
  - **Directory Lookup:** Direct browse tab displaying all checked-in guests.
- **Visitor Clearance Card:**
  - Validates visitor identity, host, arrival time, and total duration on premises before clearance.
- **Departure Confirmation:**
  - Updates visitor records to `CHECKED_OUT`, logs checkout timestamp, calculates final visit duration, and generates audit log entries.

---

### 4.4 Admin Operations & Management Portal (`/admin/*`)

#### 1. Executive Dashboard (`/admin/dashboard`)
- **6 Primary Metric Cards:**
  1. *Total Today:* Total registrations logged today.
  2. *Currently Inside:* Live count of people on premises (links to emergency headcount).
  3. *Expected:* Pre-registered attendees scheduled to arrive.
  4. *Check-Ins:* Completed arrival clearances today.
  5. *Checked Out:* Departures cleared today.
  6. *Denied Entries:* Visits flagged or rejected.
- **Live Gate Activity Stream:** Chronological feed of visitor entries, registrations, and departures.
- **Peak Gate Traffic Heatmap:** Hourly distribution of gate traffic over the past 7 days.
- **Quick Links:** Visitors directory, emergency evacuation, terminal, reports, and QR generator.

#### 2. Visitors Directory (`/admin/visitors`)
- Searchable and filterable master register.
- Filter by status (Checked In, Checked Out, All), date ranges, departments, and visitor types.
- Supports manual checkout, profile inspection, and record modification.

#### 3. Emergency Evacuation Headcount (`/admin/emergency`)
- Real-time grounds roll call with 10-second polling.
- **Incident Command Screen Mode:** High-contrast emergency room display.
- One-click **Print Roll Call** and **Export CSV** for emergency services.
- Detailed roster showing visitor name, phone, host, department, vehicle plate, and location.

#### 4. Pre-Registration & Expected Attendees (`/admin/expected-attendees` & `/admin/pre-registration`)
- Pre-authorizes VIPs, delegates, contractors, and expected guests before arrival.
- **Bulk CSV Import:** Upload participant rosters for conferences and conventions.
- Exports expected attendee lists to spreadsheet formats.

#### 5. Security Watchlist & Incident Management
- **Watchlist (`/admin/watchlist`):** Maintain active records of restricted or flagged persons with justification and descriptions. Automatically screened at the gate.
- **Incident Reports (`/admin/incidents`):** Log security occurrences with severity ratings (Low, Medium, High, Critical), status tracking (Open, Investigating, Resolved), location, and investigative notes.

#### 6. Operations & Facility Management
- **Shift Handover Logs (`/admin/shift-handover`):** Formal shift handover documentation capturing on-site counts, pending tasks, incident summaries, equipment status, and officer signatures.
- **Vehicles Log (`/admin/vehicles`):** Parking and vehicle entry log tracking vehicle plates, owners, make/model, and entry timestamps.
- **Hosts & Staff Directory (`/admin/hosts-staff`):** Database of convention centre personnel, departments, and internal phone extensions.
- **Visitor Categories (`/admin/visitor-categories`):** Manage customizable visitor classifications.
- **Meeting Management (`/admin/meetings`):** Schedule on-site meetings and link visitors to specific meeting rooms.

#### 7. Analytics, Reporting & Audit
- **Reports & BI Analytics (`/admin/reports`):** Date-range analytics, peak arrival hour analysis, department visit distributions, and CSV data export.
- **Full Audit Trail (`/admin/audit-log`):** Immutable chronological record of system activities (`CHECK_IN`, `CHECK_OUT`, `REGISTER`, `UPDATE`, `DELETE`) with user attribution.
- **System Settings (`/admin/settings`):** User account provisioning, password management, and system-wide configurations.

---

## 5. Security & Data Integrity

1. **Parameterised Database Queries:** SQL execution via Neon Serverless tagged template queries prevents SQL injection.
2. **Password Cryptography:** BCrypt salting and hashing prevents plaintext credential leakage.
3. **Session Hardening:** Role-validated session tokens prevent privilege escalation between guard and admin tiers.
4. **Audit Trail Immutability:** Sensitive security actions trigger database-level audit log creation with timestamps and IP/user identity.
5. **Fail-Safe Emergency Redundancy:** Roll-call rosters support offline printing and CSV extraction.

---

## 6. Route & API Endpoint Architecture

```
/                                   -> Public Entrance Kiosk
/register                           -> Multi-step Registration Form
/register/success                   -> Digital Gate Pass & QR Code
/pdf                                -> QCC Information Document Viewer
/guard                              -> Guard Station Terminal
/check-out                          -> QR & Manual Departure Terminal

/admin/login                        -> Staff Authentication
/admin/dashboard                    -> KPI Overview & Activity Stream
/admin/visitors                     -> Master Visitors Directory
/admin/emergency                    -> Live Emergency Evacuation Headcount
/admin/expected-attendees           -> Pre-registration Roster & Check-In
/admin/pre-registration             -> Single & Bulk Pre-registration
/admin/reports                      -> Historical Analytics & Data Export
/admin/watchlist                    -> Security Watchlist Management
/admin/incidents                    -> Security Incident Tracking
/admin/shift-handover               -> Guard Shift Turnover Records
/admin/vehicles                     -> Vehicle Entry & Parking Log
/admin/hosts-staff                  -> PCC Internal Staff Directory
/admin/visitor-categories           -> Custom Visitor Classification
/admin/meetings                     -> Meeting & Conference Scheduling
/admin/qr-code                      -> QR Code Generator
/admin/settings                     -> User Accounts & System Settings
/admin/audit-log                    -> Immutable System Activity Log

/api/register                       -> Public registration & instant check-in
/api/walk-in                        -> Guard-assisted walk-in check-in
/api/check-in                       -> Manual check-in handler
/api/check-out                      -> Visitor departure logging
/api/active-visitors                -> Live on-site visitor headcount
/api/emergency                      -> Evacuation roster & CSV generator
/api/overstay-alerts                -> Long-stay alert monitoring (>4h)
/api/participants                   -> Master participants CRUD & search
/api/watchlist                      -> Watchlist screening & CRUD
/api/incidents                      -> Incident reports CRUD
/api/shift-handover                 -> Shift turnover logging
/api/reports                        -> Analytics aggregation & export
/api/audit-log                      -> Paginated audit event log
/api/settings                       -> System & event parameters
```

---

*Document compiled for PCC VMS — Pentecost Convention Centre.*

