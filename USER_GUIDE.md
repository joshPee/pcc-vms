# QCC Meeting Web App - Beginner's Guide

## Table of Contents
1. [Overview](#overview)
2. [For Participants](#for-participants)
3. [For Admin Users](#for-admin-users)
4. [Key Features](#key-features)
5. [Troubleshooting](#troubleshooting)

---

## Overview

The QCC Meeting Web App is a comprehensive event management system for the COCOBOD Training School meeting. It handles participant registration, check-in tracking, attendance monitoring, and event administration.

**Key Benefits:**
- Easy online registration for participants
- Real-time attendance tracking
- QR code-based check-in system
- Comprehensive admin dashboard
- Export functionality for reports

---

## For Participants

### 1. Registration

**How to Register:**
1. Navigate to the registration page (usually shared via link)
2. Fill in your personal information:
   - Full Name
   - Organisation
   - Position
   - Phone Number (optional)
   - Email (optional)
3. Click "Register" to submit
4. You'll receive a unique registration code (e.g., QCC-XXXX)
5. Save this code for check-in purposes

**Registration Status:**
- **PENDING:** Registration submitted but not yet confirmed
- **REGISTERED:** Registration confirmed and approved
- **CHECKED_IN:** You have been checked in at the event

### 2. Accessing Event Information

**Via QR Code:**
1. Scan the event QR code (provided by organizers)
2. This will take you to the event information page
3. View/download the official event document

**Direct Link:**
- Access the event information page directly via the provided URL

---

## For Admin Users

### 1. Login

1. Navigate to `/admin/login`
2. Enter your admin credentials
3. You'll be redirected to the admin dashboard

### 2. Admin Dashboard

The dashboard provides a real-time overview of the event:

**Summary Cards:**
- **Registered:** Total number of registered participants
- **Checked In:** Participants who have arrived
- **Not Yet Arrived:** Expected participants not yet checked in
- **Attendance %:** Percentage of registered participants checked in

**Quick Actions:**
- Navigate to different admin sections
- View event statistics
- Access participant management

### 3. Check-In System

**Individual Check-In:**
1. Go to `/admin/check-in`
2. Enter the participant's registration code or name
3. Click "Search"
4. Verify participant details
5. Click "Check In" to confirm attendance

**Bulk Check-In:**
1. Go to `/admin/registrations`
2. Select multiple participants using checkboxes
3. Click "Bulk Check In" button
4. Confirm the action

**Walk-In Registration:**
1. On the check-in page, click "Add Walk-in Participant"
2. Fill in the participant's details
3. Optionally check them in immediately
4. A registration code will be generated automatically

### 4. Attendance Tracking

**View Attendance:**
1. Navigate to `/admin/attendance`
2. View real-time attendance statistics
3. The page auto-refreshes every 10 seconds for live updates

**Filter and Sort:**
- Filter by status (All, Registered, Not Checked In)
- Search by name or registration code
- Sort by registration order

### 5. Participant Management

**View Participants:**
1. Go to `/admin/participants`
2. View all participants in the system
3. Filter by status or check-in status
4. Search for specific participants

**Add Participant:**
1. Click "Add Participant" button
2. Fill in participant details
3. Click "Save"

**Edit Participant:**
1. Click the "Edit" button next to a participant
2. Update the information
3. Click "Save Changes"

**Delete Participant:**
1. Click the "Delete" button next to a participant
2. Confirm the deletion

**Export Participants:**
1. Click "Export CSV" button
2. Download the participant list as a CSV file

### 6. Registrations Management

**View Registrations:**
1. Navigate to `/admin/registrations`
2. View all registrations with their status
3. Filter by status, source, or search query
4. Sort by various fields

**Pre-Registration:**
1. Click "Pre-Register" button
2. Add participants before they arrive
3. Generate registration codes in advance

**Export Registrations:**
1. Click "Export CSV" button
2. Download the registration list

### 7. QR Code Generator

**Generate QR Code:**
1. Go to `/admin/qr-code`
2. A QR code is automatically generated for the event PDF
3. Participants can scan this to access event information

**Download Options:**
- **Download Image:** Download the event PDF/image
- **Download QR Code:** Download the QR code image for printing
- **Share:** Share the QR code via mobile sharing
- **Refresh QR Code:** Regenerate the QR code (useful after updating the PDF)

**Instructions:**
1. Place your event image in `public/qcc-info.jpg`
2. The QR code automatically points to `/pdf`
3. Users can scan to view and download the image

---

## Key Features

### Real-Time Updates
- Dashboard statistics update automatically
- Attendance page refreshes every 10 seconds
- Check-in status updates immediately

### Caching System
- API responses are cached for 5 seconds
- Cache is automatically cleared on data updates
- Ensures fast loading while maintaining data freshness

### Registration Codes
- **QCC-XXXX:** For QCC staff
- **TMA-XXXX:** For TMA team members
- **CTS-XXXX:** For other participants
- **MSI-XXXX:** For Mercy Ships International

### Status Tracking
- **Participant Status:** EXPECTED, REGISTERED
- **Registration Status:** PENDING, REGISTERED
- **Check-In Status:** NOT_CHECKED_IN, CHECKED_IN

---

## Troubleshooting

### Participant Cannot Check In
**Issue:** Check-in fails with "Participant has not completed registration"

**Solution:**
- Ensure the participant has completed the public registration
- Check their registration status in the admin panel
- Use walk-in registration for on-site participants

### QR Code Shows Old Content
**Issue:** Scanned QR code shows outdated event information

**Solution:**
1. Update the `public/qcc-info.jpg` file
2. Go to `/admin/qr-code`
3. Click "Refresh QR Code" button
4. Download and use the new QR code

### Dashboard Stats Not Updating
**Issue:** Dashboard shows outdated statistics

**Solution:**
- Refresh the page
- Check if the dev server is running
- Verify database connection

### Cannot Find Participant
**Issue:** Search doesn't find expected participant

**Solution:**
- Check spelling of name
- Try searching by registration code
- Verify participant is in the correct event
- Check if participant was deleted

### Export Not Working
**Issue:** CSV export fails or shows no data

**Solution:**
- Ensure there are participants to export
- Check browser permissions for downloads
- Try a different browser

---

## Best Practices

### For Admins
1. **Regular Updates:** Refresh dashboard periodically for live stats
2. **Backup Data:** Export participant lists regularly
3. **Verify Check-ins:** Double-check participant identity before check-in
4. **Use Pre-Registration:** Add expected participants in advance
5. **Monitor Attendance:** Use attendance page for real-time tracking

### For Participants
1. **Save Registration Code:** Keep your registration code safe
2. **Complete Registration:** Ensure all required fields are filled
3. **Check-In Early:** Arrive early for smooth check-in process
4. **Verify Information:** Ensure your details are correct

---

## Support

For technical issues or questions:
- Contact the event administrator
- Check the troubleshooting section above
- Verify you're using the latest version of the app

---

## Quick Reference

**Admin Pages:**
- `/admin/dashboard` - Main dashboard
- `/admin/attendance` - Attendance tracking
- `/admin/check-in` - Check-in system
- `/admin/participants` - Participant management
- `/admin/registrations` - Registration management
- `/admin/qr-code` - QR code generator

**Public Pages:**
- `/register` - Public registration
- `/pdf` - Event information
- `/register/success` - Registration success page

**API Endpoints:**
- `/api/check-in` - Individual check-in
- `/api/check-in/bulk` - Bulk check-in
- `/api/attendance/stats` - Attendance statistics
- `/api/participants` - Participant data
- `/api/registrations` - Registration data
