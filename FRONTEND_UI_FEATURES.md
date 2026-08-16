# COCOBOD Training School - Frontend & UI Features

## Overview
This document provides a comprehensive list of all frontend and UI features implemented in the COCOBOD Training School Meeting Registration application.

---

## Public Pages

### 1. Landing Page (`/`)
**Purpose:** Main entry point for participants

**Features:**
- QCC logo prominently displayed (responsive: 40px mobile, 48px desktop)
- School name: "COCOBOD TRAINING SCHOOL" (responsive typography)
- Event title: "MEETING REGISTRATION"
- Event date: "19 AUGUST 2026"
- "REGISTER NOW" button (full width mobile, 3/4 width desktop)
- Supporting text for already registered participants
- Responsive design with balanced spacing
- Clean, modern typography hierarchy
- Green color scheme matching COCOBOD branding

**Styling:**
- Background: Light gray (bg-gray-50)
- Button: Green (bg-green-700) with hover state
- Text: Dark gray for headings, medium gray for supporting text
- Responsive padding and spacing (mobile-first approach)

---

### 2. Registration Page (`/register`)
**Purpose:** Participant registration form

**Features:**
- Three-field registration form:
  - Full Name (required)
  - Organisation (required)
  - Position (required)
- Form validation with error messages
- Loading state during submission
- Success/error feedback
- Auto-generated unique registration code (CTS-XXXX format)
- Redirect to confirmation page on success

**UI Components:**
- Input fields with labels and error states
- Submit button with loading indicator
- Form validation messages
- Responsive layout

---

### 3. Registration Confirmation Page (`/register/confirmation`)
**Purpose:** Display registration success and unique code

**Features:**
- Display of unique registration code (large, prominent)
- Participant details confirmation
- Instructions for check-in
- "Register Another" button
- "Return Home" button

**UI Components:**
- Code display card with copy functionality
- Success message
- Action buttons
- Responsive layout

---

## Admin Pages

### 4. Admin Login Page (`/admin/login`)
**Purpose:** HR admin authentication

**Features:**
- Email input field
- Password input field
- Login button with loading state
- Error message display
- NextAuth integration
- Redirect to dashboard on success

**UI Components:**
- Login form with validation
- Password visibility toggle
- Error alert messages
- Responsive design

---

### 5. Admin Dashboard (`/admin/dashboard`)
**Purpose:** Overview of registration and attendance statistics

**Features:**
- **Header:**
  - QCC logo (64px)
  - School name and event details
  - Logout button

- **Navigation:**
  - Dashboard (active state)
  - Check-in
  - Registrations
  - Attendance
  - Settings

- **Statistics Cards:**
  - Total Registered
  - Total Checked In
  - Not Checked In
  - Attendance Percentage

**UI Components:**
- Stats cards with icons and numbers
- Navigation tabs with active states
- Responsive grid layout
- Color-coded statistics

---

### 6. Check-in Page (`/admin/check-in`)
**Purpose:** Search, verify, and check-in participants

**Features:**
- **Header:** Same as dashboard with QCC logo
- **Navigation:** Same as dashboard
- **Search Section:**
  - Search input (code, name, or organisation)
  - Search button
  - Loading state

- **Participant Display:**
  - Participant details (name, organisation, position)
  - Registration code
  - Check-in status
  - Check-in button (if not checked in)
  - Already checked-in message (if checked in)

- **Walk-in Registration:**
  - "Add Walk-in Participant" button
  - Modal form with:
    - Full Name
    - Organisation
    - Position
  - "Register & Check-in" button
  - "Register Only" button
  - Cancel button

**UI Components:**
- Search bar with button
- Participant card with details
- Check-in button with loading state
- Modal dialog for walk-in registration
- Success/error notifications
- Responsive layout

---

### 7. Registrations Page (`/admin/registrations`)
**Purpose:** View and manage all registrations

**Features:**
- **Header:** Same as dashboard with QCC logo
- **Navigation:** Same as dashboard
- **Filters Section:**
  - Search input (name, code, organisation)
  - Check-in status filter (All, Checked In, Not Checked In)
  - Source filter (All, Online, Walk-in)
  - Sort by (Name, Code, Registration Date)
  - Sort order (Ascending, Descending)
  - Export CSV button

- **Registrations Table:**
  - Columns: Code, Name, Organisation, Position, Status, Source, Date
  - Responsive table design
  - Status badges (green for checked in, gray for not checked in)
  - Pagination support

**UI Components:**
- Filter controls with dropdowns
- Search input
- Export button
- Data table with sorting
- Status badges
- Responsive table scrolling

---

### 8. Attendance Page (`/admin/attendance`)
**Purpose:** View attendance statistics and records

**Features:**
- **Header:** Same as dashboard with QCC logo
- **Navigation:** Same as dashboard
- **Statistics Cards:**
  - Total Registered
  - Total Checked In
  - Not Checked In
  - Attendance Percentage

- **Filters Section:**
  - Check-in status filter (All, Checked In, Not Checked In)
  - Search input
  - Export CSV button

- **Attendance Table:**
  - Same columns as registrations table
  - Filtered by check-in status
  - Real-time statistics updates

**UI Components:**
- Stats cards with icons
- Filter controls
- Export button
- Data table
- Status badges

---

### 9. Settings Page (`/admin/settings`)
**Purpose:** Configure event details

**Features:**
- **Header:** Same as dashboard with QCC logo
- **Navigation:** Same as dashboard
- **Settings Form:**
  - Event Name input
  - Event Date picker
  - Venue input
  - Registration Open toggle
  - Save button with loading state
  - Cancel button

- **Form Behavior:**
  - Load existing settings on mount
  - Save changes via API
  - Success/error feedback
  - Reset to previous values on cancel

**UI Components:**
- Form inputs with labels
- Date picker
- Toggle switch for registration status
- Save/Cancel buttons
- Loading states
- Success/error notifications

---

## Common UI Components

### Navigation
- Consistent across all admin pages
- Active state highlighting
- Responsive design
- Links to all admin sections

### Header
- QCC logo (64px on all admin pages)
- School name and event details
- Logout button
- Consistent styling across pages

### Buttons
- Primary: Green (bg-green-700)
- Secondary: Gray/White
- Danger: Red (bg-red-600)
- Loading states with spinners
- Hover effects
- Disabled states

### Forms
- Input validation
- Error messages
- Loading states
- Responsive layout
- Accessible labels

### Tables
- Responsive design
- Horizontal scrolling on mobile
- Sortable columns
- Status badges
- Consistent styling

### Modals
- Walk-in registration modal
- Overlay backdrop
- Form inputs
- Action buttons
- Close functionality

### Notifications
- Success messages
- Error messages
- Auto-dismiss
- Color-coded (green for success, red for error)

---

## Responsive Design

### Mobile (< 640px)
- Full-width buttons
- Smaller text sizes
- Reduced padding
- Horizontal table scrolling
- Stacked layouts
- Smaller logo (40px)

### Tablet (640px - 1024px)
- Medium text sizes
- Balanced padding
- Responsive grid
- 3/4 width buttons

### Desktop (> 1024px)
- Larger text sizes
- Maximum padding
- Full grid layout
- 3/4 width buttons
- Larger logo (48px on landing, 64px on admin)

---

## Color Scheme

### Primary Colors
- Green: `bg-green-700`, `hover:bg-green-800`
- Gray: `bg-gray-50`, `text-gray-900`, `text-gray-600`
- White: `bg-white`

### Status Colors
- Success: Green (checked in)
- Warning: Yellow/Orange
- Error: Red (logout button, errors)

### Text Colors
- Headings: `text-gray-900` (dark gray)
- Subheadings: `text-green-800`
- Body: `text-gray-600`
- Supporting: `text-gray-500`

---

## Typography

### Font Hierarchy
- **H1 (School Name):** `text-xl sm:text-2xl font-bold`
- **H2 (Event Title):** `text-lg sm:text-xl font-semibold`
- **H3 (Section Headers):** `text-lg font-semibold`
- **Body Text:** `text-base`
- **Small Text:** `text-sm`

### Font Weights
- Bold: headings, emphasis
- Semibold: subheadings, important text
- Medium: dates, labels
- Normal: body text

---

## Accessibility Features

- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Focus states on interactive elements
- Color contrast compliance
- Screen reader friendly
- Alt text for images

---

## Performance Optimizations

- Next.js Image component for logo optimization
- Client-side components only where needed
- Server-side rendering for initial page load
- Optimized bundle size
- Lazy loading where appropriate

---

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive design works across all viewports

---

## Future Enhancement Possibilities

- Dark mode support
- Additional language support
- More detailed analytics charts
- Print-friendly views
- Advanced filtering options
- Bulk actions for registrations
