# QCC Training School - Admin User Guide

## Welcome to the HR Admin Portal

This guide will help administrators manage events, registrations, participants, attendance, and meetings using the admin portal.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Event Management](#event-management)
4. [Registration Management](#registration-management)
5. [Participant Management](#participant-management)
6. [Attendance & Check-In](#attendance--check-in)
7. [Meeting Management](#meeting-management)
8. [Settings](#settings)

---

## Getting Started

### Accessing the Admin Portal

1. **Navigate to the Admin Login**
   - Go to `/admin/login` on your domain
   - Enter your admin credentials (email and password)

2. **Login Process**
   - Upon successful login, you'll see a success toast
   - You'll be automatically redirected to the Dashboard

3. **Navigation**
   - Use the sidebar to navigate between sections
   - On mobile, tap the menu icon to open the sidebar
   - The sidebar stays visible while scrolling on desktop

### Signing Out

- Click the "Admin" button in the top-right corner
- Select "Log out" from the dropdown menu
- A toast will confirm you're signing out before redirecting

---

## Dashboard

The Dashboard provides an overview of event statistics:

### Key Metrics

- **Total Registrations**: Number of people registered for the active event
- **Total Checked In**: Number of participants who have arrived
- **Total Not Checked In**: Registered participants who haven't arrived yet
- **Attendance Percentage**: Percentage of registered participants who have checked in

### Recent Activity

View recent registrations and check-ins to stay updated on event activity.

---

## Event Management

### Viewing Active Events

The Dashboard displays the currently active event with:
- Event name
- Event date
- Registration status (open/closed)

### Managing Events

Access event settings through the Events section to:
- Create new events
- Edit existing event details
- Open/close registration
- Set event dates and locations

---

## Registration Management

### Viewing Registrations

Access the Registrations page to see all event registrations.

**Table Columns:**
- Checkbox (for bulk actions)
- Registration Code
- Name
- Organisation
- Position
- Registration Date
- Status (Checked In / Not Checked In)
- Check-in Time
- Source (Online / Walk-in)

### Filtering and Searching

**Search**
- Search by name, registration code, or organization
- Use "Search by code only" checkbox to search exclusively by registration code

**Filters**
- Check-in Status: All, Checked In, Not Checked In
- Source: All, Online, Walk-in
- Sort By: Date (Newest/Oldest), Name (A-Z/Z-A)

### Bulk Check-In

1. Select multiple participants using the checkboxes
2. Click the "Bulk Check In" button
3. Selected participants will be marked as checked in

**Note:** Only participants with "Not Checked In" status can be selected.

### Exporting Data

Click the "Export CSV" button to download registration data including:
- All current registrations
- Applied filters and sorting
- Compatible with spreadsheet applications

### Pre-Registering Participants

1. Click the "Pre-register" button
2. Enter participant details (Name, Organisation, Position)
3. Click "Register" to create registration
4. The participant receives a registration code immediately

---

## Participant Management

### Viewing Participants

Access the Participants page to manage all event participants.

**Card View Display:**
- Participant number
- Full name
- Status badge (Expected, Confirmed, Cancelled)
- Check-in status badge
- Organization
- Position
- Email (if provided)
- Phone (if provided)
- Registration code

### Filtering Participants

**Search**
- Search by name, organization, or registration code

**Status Filter**
- All participants
- Expected
- Confirmed
- Cancelled

**Check-in Filter**
- All
- Checked In
- Not Checked In

### Adding Participants

1. Click the "+ Add Participant" button
2. Fill in the form:
   - Full Name
   - Email
   - Phone
   - Organisation
   - Position
   - Region
   - Tags
   - Participant Status
3. Click "Add Participant"

### Editing Participants

1. Click the edit (pencil) icon on a participant card
2. Modify the participant information
3. Click "Update Participant"

### Deleting Participants

1. Click the delete (trash) icon on a participant card
2. Confirm the deletion
3. The participant will be removed from the system

### Exporting Participants

Click the "Export CSV" button to download participant data with current filters applied.

---

## Attendance & Check-In

### Viewing Attendance

Access the Attendance page to monitor event attendance.

**Statistics Display:**
- Total Registered
- Total Checked In
- Total Not Checked In
- Attendance Percentage

### Attendance Table

**Columns:**
- Registration Code
- Full Name
- Organisation
- Position
- Registration Date
- Status (Checked In / Not Checked In)
- Check-in Date

### Filtering Attendance

**Search**
- Search by name, registration code, or organization

**Status Filter**
- All
- Checked In
- Not Checked In

### Manual Check-In

If a participant arrives without their code:
1. Search for their name or organization
2. Verify their identity
3. Use the Check-In page to manually check them in

---

## Check-In Desk Mode

The Check-In page is designed for on-site registration desk operations.

### Quick Check-In Process

1. **Search for Participant**
   - Enter registration code or name in the search field
   - Auto-search triggers after 3 characters
   - Results appear below the search field

2. **Verify Participant**
   - Click on a search result to view participant details
   - Review: Name, Organisation, Position, Registration Code, Check-in Status

3. **Confirm Check-In**
   - Click "Confirm & Check In"
   - Success message appears with check-in time
   - Click "Check In Another Participant" to continue

### Handling Already Checked-In Participants

If a participant is already checked in:
- A warning message displays
- Shows the original check-in time
- Shows who checked them in
- Click "Check In Another Participant" to proceed

### Walk-In Registration

1. Click "+ Add Walk-in Participant"
2. Enter:
   - Full Name (required)
   - Organisation (required)
   - Position (optional)
3. Choose:
   - "Register" - Creates registration only
   - "Register & Check In" - Creates registration and checks in immediately
4. Participant receives registration code

### Resetting Search

Click anywhere outside the search results or use the reset button to clear the search and start over.

---

## Meeting Management

### Viewing Meetings

Access the Meetings page to manage scheduled meetings.

**Meeting Cards Display:**
- Meeting title
- Date and time
- Location
- Description
- Status (Upcoming, Ongoing, Completed)

### Adding Meetings

1. Click "+ Add Meeting"
2. Fill in meeting details:
   - Title
   - Date
   - Time
   - Location
   - Description
3. Click "Add Meeting"

### Editing Meetings

1. Click the edit button on a meeting card
2. Modify meeting details
3. Click "Update Meeting"

### Deleting Meetings

1. Click the delete button on a meeting card
2. Confirm deletion
3. Meeting is removed from the schedule

---

## Settings

Access the Settings page to configure:

### Account Settings
- Update admin profile information
- Change password
- Manage security preferences

### System Settings
- Configure event defaults
- Set notification preferences
- Manage system-wide settings

---

## Tips for Efficient Administration

### Registration Management
- Use filters to quickly find specific groups
- Export data regularly for backup
- Pre-register VIP participants before the event

### Check-In Efficiency
- Use the Check-In page for on-site operations
- Keep the search field focused for quick entry
- Have a list of expected participants handy

### Data Management
- Export CSV files before making bulk changes
- Regularly review attendance statistics
- Keep participant information up to date

### Mobile Usage
- The sidebar is sticky on desktop for easy navigation
- On mobile, use the menu button to access navigation
- Tables are paginated for better mobile performance

---

## Troubleshooting

### Login Issues
- Verify your email and password are correct
- Contact system administrator if you've forgotten credentials
- Clear browser cache if login page doesn't load

### Data Not Loading
- Refresh the page
- Check your internet connection
- Contact technical support if issues persist

### Check-In Problems
- Verify participant is registered
- Check if participant is already checked in
- Use search by code for exact matches

### Export Issues
- Ensure you have permission to download files
- Check browser download settings clear
- Try a different browser if export fails

---

## Need Additional Help?

For technical issues or questions not covered in this guide:
- Contact the system administrator
- Check the application documentation
- Review error messages for specific guidance

---

**Thank you for using the QCC Training School Admin Portal!**
