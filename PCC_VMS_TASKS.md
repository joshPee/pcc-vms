# PCC VMS Improvement Tasks

Instructions for the coding agent. Before starting any task, read the current code for that area and confirm the behaviour described in `SYSTEM_OVERVIEW.md` is what actually exists. Where the code differs, follow the code and note the difference. Work in phase order, one task per commit, and add tests with each task. Ask before choosing a paid third-party service.

> **Core Operating Principle:** Guards register visitors directly at the gate after confirming with the host; visitors do **not** register themselves on a public self-service kiosk. Check-in is authorized immediately upon guard entry.

---

## Phase 1. Trust and security (do first)

- [x] **1. Enforce Guard-Driven Registration & Attributed Check-ins**
  - Registration is strictly an on-duty guard action (no public self-registration queue).
  - Protect `/api/register` and `/api/walk-in` so submissions require an active authenticated guard or admin session.
  - Every registration must record the guard's user ID and name into `ci.user_id` and audit logs (`checked_in_by`).
  - **Done when** unauthenticated requests to registration endpoints are rejected (401) and all gate check-ins carry the active officer's identity.

- [x] **2. Protect registration and authentication endpoints**
  - Rate limit login attempts (`/api/auth`) and registration endpoints per IP and user session.
  - Implement brute-force protection and lockout thresholds for gate station accounts.
  - **Done when** rapid automated requests to auth and registration endpoints are blocked with 429 Too Many Requests.

- [x] **3. Define the guard-facing watchlist decision flow**
  - Match on normalised name plus phone number against active watchlist records.
  - When a guard enters visitor details that match a watchlist record, display a high-visibility alert banner on the guard terminal with the recorded reason and risk description.
  - Provide explicit **Allow Entry** and **Deny Entry** actions for the guard:
    - Allowing entry requires a typed justification that is permanently written to the security audit log.
    - Denying entry records a `REJECTED` visit that increments the Denied Entries KPI.
  - **Done when** every watchlist match requires an explicit guard decision with an audit trail entry.

- [x] **4. Unguessable QR tokens**
  - Add a `pass_token` column holding a cryptographically random 128-bit hex string/UUID. Keep the short human-readable pass number for manual display.
  - The printed/digital pass QR encodes `pass_token`. Check-out validates via `pass_token` or pass number.
  - **Done when** knowing one visitor pass number cannot produce a valid checkout QR code.

- [x] **5. Server-side RBAC everywhere**
  - Add one reusable `requireRole()` helper and call it in every API route handler, not just middleware.
  - Write an automated test matrix validating every route against every role (`security_officer`, `supervisor`, `sector_head`, `admin`).
  - Maintain the isolation rule: Guards cannot access admin pages; Admins cannot access `/guard`.
  - **Done when** the test matrix passes and no API route lacks server-side authorization.

- [ ] **6. Auth hardening**
  - Login rate limiting and temporary account lockout after repeated failures.
  - Session idle timeout (shorter timeout for guard stations on shared gate tablets).
  - Optional TOTP 2FA for `admin` and `sector_head` administrative accounts.
  - Password strength policy and forced initial password change on newly provisioned guard accounts.

- [ ] **7. Make the audit log tamper-proof**
  - Revoke `UPDATE` and `DELETE` on the `audit_logs` table for the application's runtime DB role.
  - Ensure every gate action logs the authenticated officer (`guard:name (id)`), IP address, and timestamp.
  - Optional hash chain across audit entries so record alteration or deletion is cryptographically detectable.
  - **Done when** an `UPDATE` or `DELETE` executed against `audit_logs` fails at the database permission level.

---

## Phase 2. Reliability and data accuracy

- [ ] **8. Nightly reconciliation of forgotten checkouts**
  - Scheduled automated job at a configurable time (e.g. 23:59) using the `Africa/Accra` timezone.
  - Visitors still marked `CHECKED_IN` are transitioned to `AUTO_CHECKED_OUT`, logged in the audit trail, and cleared from the live on-site headcount.
  - Skip visitors marked multi-day or guest house residents (see task 10).
  - **Done when** the active grounds count reliably resets to genuinely present overnight occupants each morning.

- [ ] **9. Complete grounds evacuation roll call**
  - Include staff on duty and registered guest house residents into the emergency headcount roster.
  - Group roll call print and CSV export into clear sections: Visitors, On-Duty Staff, Guest House Occupants.
  - Confirm with facility management where internal staff presence is sourced.

- [ ] **10. Per-category overstay rules**
  - Add `overstay_minutes` and a `multi_day` boolean flag to visitor categories (default: 240 mins).
  - Overstay alerts on `/guard` evaluate based on category threshold (e.g. Contractors vs. Guest House guests).
  - Multi-day visits do not trigger daily overstay warnings.

- [ ] **11. Offline-capable guard station terminal**
  - Convert `/guard` and `/check-out` into a Progressive Web App (PWA).
  - Service worker caches application shell and current on-site visitor roster.
  - Offline check-ins and check-outs are stored in an IndexedDB queue with idempotency keys and synchronized automatically upon network restoration.
  - Display a live offline indicator and pending-sync queue badge on the guard portal.
  - **Done when** guards can process visitor entry and exit during network interruptions without duplicate records.

- [ ] **12. Timezone correctness**
  - Force explicit `Africa/Accra` (GMT) timezone resolution across shift detection, "Today" KPI counts, check-in timestamps, and analytical reports.

- [ ] **13. Real-time sync transparency**
  - Ensure emergency roll call and guard on-site headcount display a clear "Last updated: HH:MM:SS" sync indicator alongside the 10-second polling pulse.

---

## Phase 3. Gate features

- [ ] **14. Host arrival SMS notification**
  - Send an automated SMS to the host staff member as soon as the guard checks their visitor in at the gate.
  - Integrate with Ghana SMS gateway (Arkesel, Hubtel, or mNotify).
  - Deliver notifications asynchronously so network latency or SMS failure never blocks gate check-in.

- [ ] **15. Group & delegation registration**
  - Allow guards to log group arrivals (delegation, bus, church group) under a single host and purpose.
  - Generate individual pass numbers for each person while linking them to a common group lead and vehicle registration.

- [ ] **16. Pre-registration gate clearance**
  - Expected conference and VIP attendees receive an SMS pass with their QR code prior to arrival.
  - Guards scan the attendee's pre-registration QR code to execute an immediate 1-tap check-in.

- [ ] **17. Photo capture & printable gate pass**
  - Optional gate camera capture of visitor portrait during guard registration.
  - Printable pass slip formatting optimized for thermal receipt and badge printers.

- [ ] **18. Vehicle exit tracking**
  - Link vehicle plate records to checkout timestamps.
  - Flag vehicles that remain logged on premises after the visitor has departed.

- [ ] **19. Web Speech API feature detection**
  - Safely feature-detect browser speech recognition on the registration form; hide voice input mic buttons on unsupported browsers and gate hardware without errors.

---

## Phase 4. Privacy and data protection (Ghana Act 843)

- [ ] **20. Guard station form hygiene**
  - Registration form automatically resets all input states and focus after successful visitor check-in, ready for the next vehicle/visitor.
  - Short data privacy disclosure banner confirming compliance with Ghana Data Protection Act 843.

- [ ] **21. Data retention & anonymisation policy**
  - Configurable data retention period in system settings.
  - Automated job anonymises or purges visitor Personally Identifiable Information (PII) beyond the retention window while preserving aggregate statistical totals.

- [ ] **22. Encryption & masking of national ID numbers**
  - Encrypt sensitive identification numbers at rest (AES-GCM with environment key).
  - Mask ID numbers in UI tables (e.g. `GHA-•••••••••-1`).
  - Reveal actions are permission-gated (supervisor+) and logged to the audit trail.

- [ ] **23. Audit logging of sensitive record reads**
  - Generate audit records when administrative users view watchlist details, unmask IDs, or export visitor logs.

---

## Phase 5. Documentation and operations

- [ ] **24. Align `SYSTEM_OVERVIEW.md`**
  - Ensure all diagrams and documentation reflect the guard-operated registration model.
  - Document all active API routes accurately.
  - Ensure PCC naming standards throughout.

- [ ] **25. Deployment & backup runbook**
  - Document required environment variables, database migration procedures, and Neon point-in-time recovery processes.

- [ ] **26. Automated test suite**
  - Integration tests for: guard registration lifecycle, watchlist decision logging, RBAC matrix, and nightly reconciliation.

- [ ] **27. Healthcheck & monitoring**
  - Implement `/api/health` checking DB connectivity and station responsiveness with uptime alerting.
