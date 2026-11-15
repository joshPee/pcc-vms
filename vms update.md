# PCC Visitor Management System

## Requirements, Operational Workflow, and Existing-System Audit

## 1. Project Objective

Develop a modern Visitor Management System (VMS) for the main entrance
of Pentecost Convention Centre (PCC).

The system must help security guards:

-   Control access to the premises.
-   Register and verify visitors.
-   Record visitor entry and exit.
-   Track visitors currently inside the premises.
-   Maintain accurate, searchable visitor records.
-   Support supervisors with monitoring, reports, and audit trails.

The system should prioritise security, accountability, speed, accuracy,
and ease of use.

## 2. Important Instruction to the AI Development Agent

Before changing or adding any code, inspect the existing project
thoroughly.

**Audit the current system against every requirement in this document.
Do not assume a feature is missing simply because it is not immediately
visible.**

The audit must:

1.  Inspect the existing frontend, backend, database schema,
    authentication, and current workflows.
2.  Identify features that already exist and explain how each one works.
3.  Identify features that are partially implemented, broken, or
    missing.
4.  Check whether existing features work end to end, rather than relying
    only on the presence of a button or screen.
5.  Identify database fields, API endpoints, validation rules,
    permissions, and reports related to each feature.
6.  Avoid duplicating existing functionality.
7.  Preserve working features and existing data.
8.  Recommend changes in priority order.
9.  Present an audit report before implementing major changes.
10. Do not remove or rename existing fields, tables, routes, or
    components without explaining the impact and obtaining approval.

For each requirement, assign one status:

-   **Implemented:** Works as required.
-   **Partially implemented:** Exists but needs improvement or has
    limitations.
-   **Missing:** Not present.
-   **Needs testing:** Evidence is insufficient to confirm that it
    works.

Include the relevant file paths, database tables or fields, API routes,
and UI screens as evidence wherever possible.

### Optional visitor information

The visitor's Ghana Card or other identification number and photograph
must be **optional**.

-   A visitor must be registrable without providing a Ghana Card number.
-   A visitor must be registrable without taking or uploading a
    photograph.
-   Do not block check-in because either optional field is empty.
-   Do not make these fields mandatory through frontend validation,
    backend validation, or database constraints.
-   If provided, store the information securely and restrict access
    according to user permissions.
-   Clearly mark both fields as optional in the interface.

The visitor's full name, phone number, person or department being
visited, and purpose of visit should be required unless the existing
operational policy defines an approved exception.

## 3. Visitor Registration and Check-in

Every visitor should be registered before entry is authorised.

The guard should select **New Visitor** and complete a simple
registration form.

### Recommended registration fields

  -----------------------------------------------------------------------
  Field                   Requirement             Description
  ----------------------- ----------------------- -----------------------
  Full Name               Required                Visitor's complete name

  Phone Number            Required                Visitor's contact
                                                  number

  Organisation            Optional                Company, institution,
                                                  or organisation

  Person to Visit         Required                Staff member or host

  Department              Recommended             Department of the host

  Purpose of Visit        Required                Reason for visiting

  Visitor Type            Required                Personal, Official,
                                                  Contractor, Guest,
                                                  Delivery, or other
                                                  configured type

  ID Type                 Optional                Ghana Card, Passport,
                                                  Voter ID, Driver's
                                                  Licence, or other type

  ID Number               Optional                Identification number,
                                                  if supplied

  Photograph              Optional                Visitor photograph, if
                                                  supplied

  Vehicle Registration    Optional                Vehicle registration
                                                  number

  Guard on Duty           Automatic               Logged-in guard's
                                                  account

  Date and Time           Automatic               Registration timestamp

  Visitor Pass Number     Automatic               Unique system-generated
                                                  pass number
  -----------------------------------------------------------------------

### Registration behaviour

-   Generate a unique visitor pass number automatically.
-   Use a format such as `PCC-V8K294`.
-   Do not generate predictable sequential pass numbers such as
    `PCC-V001`.
-   Prevent duplicate active visitor records where appropriate.
-   Show a clear confirmation after successful registration.
-   Make the form quick to complete on a desktop, tablet, or mobile
    phone.
-   Display required and optional fields clearly.

## 4. Visitor Verification and Approval

Registration must not automatically grant access.

The system should support an approval workflow:

1.  Visitor arrives at the main entrance.
2.  Guard registers the visitor.
3.  Guard verifies the visitor's details.
4.  Guard contacts the person being visited.
5.  Host confirms or rejects the visit.
6.  Guard records the approval decision.
7.  If approved, the guard issues a visitor pass and records entry.
8.  If rejected, the guard records the reason where appropriate and
    denies entry.

### Access statuses

  Status        Meaning
  ------------- --------------------------------------
  Pending       Awaiting host or authorised approval
  Approved      Visitor has permission to enter
  Rejected      Entry has been denied
  Checked In    Visitor has entered the premises
  Checked Out   Visitor has left the premises
  Cancelled     Visit was cancelled before entry

The system should record who approved or rejected the visit and when the
decision occurred.

For sensitive locations, authorised supervisors or management should be
able to approve visitors according to PCC policy.

## 5. Visitor Check-out

The system must account for every visitor who enters the premises.

When a visitor leaves:

1.  Visitor presents the physical visitor pass.
2.  Guard enters or scans the pass number.
3.  System retrieves the visitor's active record.
4.  Guard confirms the visitor's details.
5.  Guard records the departure.
6.  System records the exit time.
7.  Guard collects the physical visitor pass.
8.  System changes the visitor's status to Checked Out.

The system should not allow a visitor record to be closed without an
exit timestamp, except through a controlled supervisor correction
process.

### Example visitor status table

  Visitor       Time In    Time Out   Current Status
  ------------- ---------- ---------- ----------------
  John Mensah   09:15 AM   11:30 AM   Checked Out
  Mary Owusu    10:00 AM   ---        Inside
  Peter Asare   11:20 AM   ---        Inside

The dashboard should update the number of visitors inside as check-ins
and check-outs occur.

## 6. Security Dashboard

The guard dashboard should present essential information immediately
after login.

### Dashboard statistics

  -----------------------------------------------------------------------
  Component                           Function
  ----------------------------------- -----------------------------------
  Total Visitors Today                Number of visitors registered
                                      during the current day

  Currently Inside                    Visitors who have checked in but
                                      have not checked out

  Expected Visitors                   Visitors scheduled to arrive

  Pending Approvals                   Visitors awaiting approval

  Checked Out                         Visitors who have departed

  Denied Entries                      Visitors whose entry was rejected
  -----------------------------------------------------------------------

### Dashboard activity

The dashboard should also display:

-   Recent visitor registrations.
-   Recent check-ins and check-outs.
-   Visitors currently inside.
-   Pending approvals.
-   Security alerts.
-   Quick visitor registration.
-   Quick visitor check-out.
-   Search by visitor name, pass number, phone number, or vehicle
    registration.

The interface should be simple and readable. Guards should complete
common actions with minimal navigation.

## 7. Essential Security Features

### 7.1 Duplicate visitor detection

Alert the guard when matching identification details or phone numbers
appear in existing records.

Do not automatically block a visitor solely because a phone number has
appeared before. Allow the guard to review the match.

### 7.2 Overstay alerts

Flag visitors who remain on the premises beyond a configured visit
duration.

Allow authorised supervisors to review and resolve overstay alerts.

### 7.3 Unreturned visitor passes

Track issued and returned physical visitor passes.

Show passes that remain outstanding after a visitor's recorded departure
or flag inconsistent pass records for supervisor review.

### 7.4 Blacklisted visitors

Allow authorised supervisors to add and manage restricted visitors.

-   Display a clear alert when a matching visitor attempts registration.
-   Restrict blacklist management to authorised roles.
-   Record who added or changed a restriction and why.
-   Provide a controlled process for reviewing and removing
    restrictions.

### 7.5 Emergency visitor report

Provide a quick report of all visitors currently recorded inside the
premises.

The report should include:

-   Visitor name.
-   Visitor pass number.
-   Phone number, where available.
-   Person or department being visited.
-   Vehicle registration, where available.
-   Check-in time.
-   Entrance or location, if supported.

### 7.6 Audit trail

Record important system activities, including:

-   Who registered a visitor.
-   Who approved or rejected entry.
-   Who recorded check-in and check-out.
-   Who edited a visitor record.
-   What information changed.
-   When the change occurred.
-   Who changed visitor status or corrected a record.

Ordinary guards should not be able to erase audit history.

## 8. User Roles and Permissions

Use role-based access control. Each user should receive only the
permissions required for their duties.

  -----------------------------------------------------------------------
  Role                                Recommended Permissions
  ----------------------------------- -----------------------------------
  Security Guard                      Register visitors, verify details,
                                      record check-in and check-out, view
                                      relevant active visitor records

  Security Supervisor                 Monitor entrance activity, review
                                      records, handle exceptions, view
                                      reports, review alerts

  Department Head                     View authorised reports and monitor
                                      visitor activity

  System Administrator                Manage users, roles, permissions,
                                      system settings, and configurations
  -----------------------------------------------------------------------

The system should record the account responsible for each action. Avoid
shared guard accounts.

## 9. Reports and Analytics

The system should generate reports automatically and support PDF and
Excel exports.

### Daily reports

-   Total visitors registered.
-   Total visitors checked in.
-   Total visitors checked out.
-   Visitors still inside.
-   Denied entries.
-   Visitors by organisation.
-   Visitors by purpose of visit.
-   Visitor pass records.

### Weekly reports

-   Total visitor traffic.
-   Busiest visiting days.
-   Peak visiting hours.
-   Most frequently visited departments.
-   Visitor categories and trends.

### Monthly reports

-   Monthly visitor traffic.
-   Departmental visitor statistics.
-   Frequent visitors.
-   Visitor trends.
-   Security incidents involving visitors.
-   Outstanding or inconsistent visitor pass records.

Reports should support date filters and relevant search filters. Only
authorised users should access sensitive reports.

## 10. PCC-Specific Features

Consider the following features to support PCC operations.

  -----------------------------------------------------------------------
  Feature                             Purpose
  ----------------------------------- -----------------------------------
  Staff Directory                     Helps guards identify employees and
                                      departments

  Host Notification                   Notifies staff when their visitors
                                      arrive

  Event Visitor Mode                  Handles large conferences and
                                      gatherings

  Contractor Registration             Separates contractors from ordinary
                                      visitors

  Vehicle Management                  Records vehicles entering and
                                      leaving

  VIP Visitor Management              Applies additional access controls
                                      where authorised

  Delivery Management                 Records incoming goods and delivery
                                      personnel

  Emergency Headcount                 Lists visitors recorded inside the
                                      premises

  Multiple Entrance Support           Supports future expansion to other
                                      entrances
  -----------------------------------------------------------------------

### Event Mode

During conferences and large gatherings, normal registration might slow
down entrance operations.

Event Mode should support:

-   Pre-registered attendees.
-   QR-code visitor passes.
-   Quick check-in.
-   Event-specific visitor reports.
-   Separate attendee, staff, contractor, and guest records.
-   Event date and access rules.
-   A clear process for handling visitors who are not on the
    pre-registration list.

Event Mode should not bypass security approval rules unless an
authorised event policy explicitly permits a different workflow.

## 11. Recommended Technical Architecture

Review the current project's technology before recommending a migration.
Retain the existing stack if it meets the requirements and supports
reliable operation.

For a larger, scalable implementation, consider:

  Component        Suggested Technology
  ---------------- ---------------------------------------------------
  Frontend         Next.js and TypeScript
  UI               Tailwind CSS
  Backend          Next.js API or a dedicated backend
  Database         PostgreSQL
  ORM              Prisma
  Authentication   Secure authentication with role-based permissions
  QR Codes         QR code generation and scanning library
  Reports          ExcelJS and PDF generation
  Hosting          Vercel or an appropriate cloud host

The interface should be mobile-first and work well on desktop computers
at the main entrance.

The system should also account for internet interruptions. Assess
whether a safe offline or temporary manual fallback is required. If
offline support is introduced, define how records sync and how duplicate
or conflicting records are handled.

## 12. Standard Security Guard Workflow

The normal visitor process should follow this sequence:

1.  Visitor arrives.
2.  Guard receives the visitor.
3.  Guard registers the visitor.
4.  Guard verifies the visitor's details.
5.  Guard contacts the host.
6.  Host or authorised person confirms the visit.
7.  Guard checks the approval status.
8.  If approved, guard issues a physical visitor pass.
9.  Guard records the visitor's entry.
10. Visitor enters the premises.
11. Visitor returns to the main entrance when leaving.
12. Guard retrieves the visitor record using the pass number.
13. Guard confirms the visitor's details.
14. Guard records the exit time.
15. Guard collects the physical pass.
16. System closes the visitor record.

If entry is rejected, the guard records the decision and follows PCC
security procedures.

## 13. Operational and Reliability Requirements

The system should:

-   Use clear labels and simple forms.
-   Minimise the number of steps required for registration.
-   Work on desktop, tablet, and mobile screens.
-   Use accurate timestamps.
-   Prevent accidental duplicate check-ins and check-outs.
-   Validate visitor pass numbers.
-   Protect records from unauthorised access.
-   Maintain audit logs.
-   Provide clear error messages.
-   Confirm successful actions.
-   Support backups and data recovery.
-   Restrict access to personal information.
-   Avoid exposing optional Ghana Card details or photographs to users
    without a legitimate operational need.

## 14. Implementation Priorities

Prioritise the following features before advanced additions.

### Phase 1: Core visitor operations

1.  Visitor registration.
2.  Optional Ghana Card or other ID details.
3.  Optional visitor photograph.
4.  Visitor identity verification and host approval.
5.  Unique visitor pass generation.
6.  Check-in and check-out.
7.  Real-time visitor tracking.
8.  Basic daily reports.

### Phase 2: Security and supervision

1.  Role-based permissions.
2.  Audit trail.
3.  Duplicate visitor detection.
4.  Overstay alerts.
5.  Visitor pass tracking.
6.  Blacklist management.
7.  Emergency visitor report.
8.  Supervisor dashboard.

### Phase 3: Operational expansion

1.  Staff directory.
2.  Host notifications.
3.  Contractor and delivery management.
4.  Vehicle management.
5.  VIP visitor management.
6.  Event Mode.
7.  Multiple entrance support.
8.  Advanced analytics.

## 15. Required AI Agent Audit Report

After inspecting the existing project, produce a report using the
following structure.

### A. Existing System Overview

-   Current technology stack.
-   Current database structure.
-   Existing user roles.
-   Existing visitor registration workflow.
-   Existing check-in and check-out workflow.
-   Existing reports and dashboard.
-   Existing security controls.

### B. Feature-by-Feature Assessment

Use this table:

  ------------------------------------------------------------------------------
  Requirement      Status         Existing         Gap or         Recommended
                                  Implementation   Limitation     Action
  ---------------- -------------- ---------------- -------------- --------------
  Visitor                                                         
  registration                                                    

  Required and                                                    
  optional fields                                                 

  Optional Ghana                                                  
  Card details                                                    

  Optional visitor                                                
  photograph                                                      

  Unique visitor                                                  
  pass                                                            

  Host approval                                                   

  Check-in                                                        

  Check-out                                                       

  Real-time                                                       
  visitor tracking                                                

  Security                                                        
  dashboard                                                       

  Duplicate                                                       
  detection                                                       

  Overstay alerts                                                 

  Pass tracking                                                   

  Blacklist                                                       
  management                                                      

  Emergency                                                       
  visitor report                                                  

  Audit trail                                                     

  Role-based                                                      
  permissions                                                     

  Daily reports                                                   

  Weekly reports                                                  

  Monthly reports                                                 

  Staff directory                                                 

  Host                                                            
  notifications                                                   

  Event Mode                                                      

  Vehicle                                                         
  management                                                      

  Contractor                                                      
  management                                                      

  Delivery                                                        
  management                                                      

  VIP management                                                  

  Multiple                                                        
  entrance support                                                

  Mobile                                                          
  responsiveness                                                  

  Backup and                                                      
  recovery                                                        

  Offline or                                                      
  fallback                                                        
  procedure                                                       
  ------------------------------------------------------------------------------

### C. Critical Findings

List:

-   Features that work correctly.
-   Features that need improvement.
-   Missing critical security controls.
-   Data integrity risks.
-   Usability problems affecting guards.
-   Privacy and access-control concerns.
-   Performance or reliability concerns.

### D. Recommended Action Plan

Group proposed changes into:

-   Critical.
-   High priority.
-   Medium priority.
-   Future enhancement.

For each recommendation, explain the reason, affected parts of the
project, and expected result.

### E. Implementation Plan

After presenting the audit, propose a safe implementation sequence.

Do not begin a large rewrite before identifying the existing system's
strengths and weaknesses. Implement improvements incrementally, preserve
existing visitor records, and test each workflow.

## 16. Acceptance Tests

Before declaring the system ready, verify the following:

1.  A guard registers a visitor without a Ghana Card number.
2.  A guard registers a visitor without a photograph.
3.  A visitor record saves successfully when both optional fields are
    empty.
4.  The system generates a unique visitor pass number.
5.  A visitor cannot enter through the normal workflow while approval is
    pending.
6.  A rejected visitor cannot be checked in through the normal workflow.
7.  An approved visitor can be checked in.
8.  A checked-in visitor appears in the Currently Inside count.
9.  A visitor can be checked out using the visitor pass number.
10. The exit timestamp saves correctly.
11. A checked-out visitor no longer appears in the Currently Inside
    count.
12. A guard cannot silently alter or erase audit history.
13. A supervisor can view authorised reports.
14. An unauthorised user cannot access restricted administration
    functions.
15. Emergency reporting lists all visitors recorded inside.
16. Reports return accurate results for selected dates.
17. The system handles duplicate or repeated submissions safely.
18. The interface works on desktop and mobile screens.
19. Errors and failed submissions produce clear feedback.
20. Existing visitor records remain intact after updates.

## Final Direction to the AI Agent

**Start by auditing the current Visitor Management System against this
document.**

Do not immediately rebuild the application or introduce a new technology
stack.

Identify what already exists, what works, what needs improvement, and
what is missing. Pay special attention to the registration, approval,
check-in, check-out, visitor tracking, reporting, permissions, and audit
trail workflows.

Remember: Ghana Card details and visitor photographs are optional. The
system must allow successful visitor registration and check-in without
either field.

Present the complete audit report and a prioritised implementation plan
before making major changes.


## 17. QR Code Self-Registration and Guard-Assisted Registration

### Recommended approach: Hybrid registration

PCC should support both visitor self-registration through a QR code and direct registration by a security guard.

The QR code should make registration faster. It must not grant access automatically. Security guards retain responsibility for identity checks, host confirmation, and the final access decision.

### A. Visitor QR Registration Portal

Place a clearly visible QR code at the main entrance. When scanned, the QR code should open a mobile-friendly visitor registration form.

The form should collect:

- Full name.
- Phone number.
- Organisation, optional.
- Person to visit.
- Department, where applicable.
- Purpose of visit.
- Visitor type.
- Vehicle registration, optional.
- ID type and ID number, optional.
- Photograph, optional.

The form should not require visitors to create an account.

After submission:

1. Validate the submitted information.
2. Create a visitor submission with a unique reference.
3. Set the access status to Pending.
4. Display a submission confirmation to the visitor.
5. Send the submission to the security guard dashboard.
6. Do not issue access or mark the visitor as checked in.

The visitor should wait at the entrance until a guard completes verification and approval.

### B. Security Guard Portal

The guard portal should provide two registration paths:

1. Review QR submissions.
2. Register a visitor manually.

The guard should be able to:

- View newly submitted visitor details.
- Search and review existing visitor records.
- Verify the visitor in person.
- Contact the intended host.
- Record host confirmation or rejection.
- Approve or reject the visit.
- Record the reason for rejection, where appropriate.
- Generate and issue a physical visitor pass after approval.
- Complete check-in and check-out.
- Register visitors who do not have smartphones or cannot use the QR form.

Record the guard account responsible for each action.

### C. Recommended Registration Methods by Visitor Type

| Visitor Category | Recommended Registration Method |
|---|---|
| Ordinary visitors | QR self-registration, with guard-assisted registration available |
| Visitors without smartphones | Guard-assisted registration |
| VIP visitors | Guard-assisted registration |
| Contractors | Guard registration or approved pre-registration |
| Event attendees | QR registration or pre-registration |
| Delivery personnel | Guard-assisted registration |
| Emergency situations | Guard-assisted registration, following PCC emergency procedures |

These are recommended defaults. Authorised PCC policy should determine any exceptions.

### D. QR Code Security Requirements

The entrance QR code should open only the registration form. It must not contain a permanent access credential.

Implement the following safeguards:

- Use HTTPS for the registration portal.
- Generate a unique submission reference for every registration.
- Detect repeated submissions and possible duplicates.
- Validate and sanitise all submitted data on the server.
- Apply rate limits and abuse protection.
- Prevent visitors from changing approval or check-in status.
- Do not expose other visitors' records through the public portal.
- Do not display sensitive visitor information in public confirmation pages.
- Keep Ghana Card details and photographs optional.
- Restrict access to submitted personal information by user role.
- Record approval, rejection, and record changes in the audit trail.
- Provide a safe process for expired, abandoned, or duplicate submissions.

If the QR code is replaced or compromised, administrators should have a way to disable or rotate the registration link.

### E. Recommended End-to-End QR Workflow

1. Visitor arrives at the main entrance.
2. Visitor scans the entrance QR code.
3. Registration form opens on the visitor's phone.
4. Visitor submits the required details. Ghana Card details and photograph remain optional.
5. System creates a Pending submission and unique reference.
6. Guard sees the submission on the security dashboard.
7. Guard meets the visitor and verifies the submitted details.
8. Guard contacts the host or authorised approver.
9. Guard records the approval decision.
10. If rejected, the system records the decision and the visitor does not enter.
11. If approved, the guard generates or assigns a physical visitor pass.
12. Guard records check-in.
13. Visitor enters the premises.
14. On departure, the visitor presents the physical pass.
15. Guard scans the pass QR code or enters the pass number.
16. Guard confirms the visitor record, records the exit time, and collects the pass.
17. System marks the visitor as Checked Out.

### F. Manual Registration Fallback

The security guard must always have a manual registration option.

Use this when:

- The visitor has no smartphone.
- The visitor cannot scan the QR code.
- The visitor has no internet connection.
- The QR registration service is unavailable.
- The visitor needs assistance.
- Security or emergency procedures require direct registration.

Manual registration must use the same validation, approval, check-in, check-out, and audit rules as QR registration. Do not create a weaker security path for manually registered visitors.

### G. AI Agent Audit Requirements for QR Registration

During the existing-system audit, check whether the project already supports:

| Requirement | Status | Existing Implementation | Gap or Limitation | Recommended Action |
|---|---|---|---|---|
| Public visitor registration portal | | | | |
| Entrance QR code | | | | |
| Mobile-friendly registration form | | | | |
| No-account visitor submission | | | | |
| Unique submission reference | | | | |
| Pending submission queue | | | | |
| Guard review of QR submissions | | | | |
| Manual guard registration | | | | |
| Duplicate submission detection | | | | |
| Server-side form validation | | | | |
| QR submission privacy controls | | | | |
| Guard-controlled approval | | | | |
| Physical visitor pass generation | | | | |
| QR pass scanning at check-out | | | | |
| Manual pass-number lookup | | | | |
| QR link disable or rotation | | | | |
| Audit trail for QR and manual actions | | | | |

The AI agent must test the complete visitor journey. A QR form alone does not count as a complete QR registration workflow.

### H. Additional QR Registration Acceptance Tests

1. A visitor scans the entrance QR code and opens the registration form on a smartphone.
2. A visitor submits the form without creating an account.
3. A visitor submits the form without Ghana Card details.
4. A visitor submits the form without a photograph.
5. A successful submission appears in the guard's pending queue.
6. A QR submission does not automatically approve entry.
7. A visitor cannot change their own approval or check-in status.
8. A guard reviews and approves a valid submission.
9. A guard rejects a submission and records the decision.
10. A guard registers a visitor manually when QR registration is unavailable.
11. QR and manual registrations follow the same access-control rules.
12. A visitor cannot view another visitor's personal information.
13. Repeated submissions are detected and handled safely.
14. A guard can issue a physical pass after approval.
15. A guard can record check-out by scanning the pass QR code or entering its number.
16. QR submissions and guard decisions appear in the audit trail.

## 18. Final Direction to the AI Agent: Registration Method

Inspect the existing project and determine whether visitor self-registration by QR code, guard-assisted registration, or both are already implemented.

Recommend a hybrid model for PCC:

- Visitor QR registration should be available as a convenient option during normal operations.
- Guard-assisted registration must remain available at all times.
- QR submission must create a pending visitor record, not grant access.
- A security guard must verify the visitor and record the required approval before entry.
- Both registration methods must use the same visitor database and security rules.
- Ghana Card details and visitor photographs must remain optional in both methods.

Do not duplicate existing registration screens or create separate visitor databases. Reuse the current architecture where appropriate. Audit first, report the gaps, then propose incremental changes.
