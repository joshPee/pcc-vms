import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUniquePassNumber } from '@/lib/pass-generator';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Guard or Admin login required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      fullName,
      organisation = '',
      position = 'Visitor',
      phone,
      location = 'PCC Campus',
      hostName,
      department,
      visitPurpose,
      visitorType = 'Official',
      idType = null,
      idNumber = null,
      photoUrl = null,
      vehicleRegistration = null,
      isRecurring = false,
      checkInImmediately = true,
    } = body;

    // Validate input (Full name, phone, host, and purpose are required; ID and photo are strictly OPTIONAL)
    if (!fullName || !phone || !hostName || !visitPurpose) {
      return NextResponse.json(
        { error: 'Full name, phone, person to visit, and purpose of visit are required.' },
        { status: 400 }
      );
    }

    const trimmedName = fullName.trim();
    const trimmedOrg = organisation?.trim() || '';
    const trimmedPos = position?.trim() || 'Visitor';
    const trimmedPhone = phone.trim();
    const trimmedLocation = location?.trim() || 'PCC Campus';
    const trimmedHost = hostName.trim();
    const trimmedDept = department?.trim() || 'General';
    const trimmedPurpose = visitPurpose.trim();
    const trimmedVisitorType = visitorType?.trim() || 'Official';
    const trimmedVehicle = vehicleRegistration?.trim().toUpperCase() || null;
    const trimmedIdType = idType?.trim() || null;
    const trimmedIdNumber = idNumber?.trim() || null;
    const trimmedPhotoUrl = photoUrl?.trim() || null;

    if (trimmedName.length < 2) {
      return NextResponse.json(
        { error: 'Full name must be at least 2 characters.' },
        { status: 400 }
      );
    }

    const hrUserId = parseInt((session.user as any).id);
    const guardName = session.user.name || 'Security Officer';

    // Check watchlist
    try {
      const watchlistEntries = await sql`
        SELECT full_name, reason FROM watchlist WHERE is_active = true
      `;
      for (const entry of watchlistEntries) {
        if (entry.full_name && trimmedName.toLowerCase().includes(entry.full_name.toLowerCase())) {
          return NextResponse.json(
            {
              watchlistAlert: true,
              error: `SECURITY ALERT: This visitor matches the watchlist. Reason: ${entry.reason}. Entry denied.`,
            },
            { status: 403 }
          );
        }
      }
    } catch {
      // ignore
    }

    // Generate unique pass number (e.g. PCC-V8K294)
    const passNumber = await getUniquePassNumber();

    let result;
    if (checkInImmediately) {
      result = await sql`
        INSERT INTO participants (
          registration_code, pass_number, full_name, organisation, position, phone, location,
          host_name, host_department, visit_purpose, visitor_type, id_type, id_number, photo_url,
          vehicle_registration, is_recurring, registration_source,
          participant_status, registration_status, approval_status, approved_by, approved_at,
          check_in_status, check_in_date, checked_in_by, created_at
        )
        VALUES (
          ${passNumber}, ${passNumber}, ${trimmedName}, ${trimmedOrg}, ${trimmedPos}, ${trimmedPhone}, ${trimmedLocation},
          ${trimmedHost}, ${trimmedDept}, ${trimmedPurpose}, ${trimmedVisitorType}, ${trimmedIdType}, ${trimmedIdNumber}, ${trimmedPhotoUrl},
          ${trimmedVehicle}, ${isRecurring}, 'WALK_IN',
          'REGISTERED', 'REGISTERED', 'APPROVED', ${hrUserId}, CURRENT_TIMESTAMP,
          'CHECKED_IN', CURRENT_TIMESTAMP, ${hrUserId}, CURRENT_TIMESTAMP
        )
        RETURNING id, registration_code, pass_number
      `;
    } else {
      result = await sql`
        INSERT INTO participants (
          registration_code, pass_number, full_name, organisation, position, phone, location,
          host_name, host_department, visit_purpose, visitor_type, id_type, id_number, photo_url,
          vehicle_registration, is_recurring, registration_source,
          participant_status, registration_status, approval_status,
          check_in_status, created_at
        )
        VALUES (
          ${passNumber}, ${passNumber}, ${trimmedName}, ${trimmedOrg}, ${trimmedPos}, ${trimmedPhone}, ${trimmedLocation},
          ${trimmedHost}, ${trimmedDept}, ${trimmedPurpose}, ${trimmedVisitorType}, ${trimmedIdType}, ${trimmedIdNumber}, ${trimmedPhotoUrl},
          ${trimmedVehicle}, ${isRecurring}, 'WALK_IN',
          'REGISTERED', 'REGISTERED', 'PENDING',
          'NOT_CHECKED_IN', CURRENT_TIMESTAMP
        )
        RETURNING id, registration_code, pass_number
      `;
    }

    const participantId = result[0].id;
    const finalPassNumber = result[0].pass_number || result[0].registration_code;
    let checkInData = null;

    if (checkInImmediately) {
      try {
        const checkInResult = await sql`
          INSERT INTO check_ins (participant_id, user_id, check_in_time)
          VALUES (${participantId}, ${hrUserId}, NOW())
          ON CONFLICT (participant_id) DO NOTHING
          RETURNING id, check_in_time
        `;

        const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
        await sql`
          INSERT INTO visitor_logs (participant_id, action, user_id, details, ip_address)
          VALUES (
            ${participantId},
            'CHECK_IN',
            ${hrUserId},
            ${`Guard-assisted walk-in check-in by ${guardName}. Pass: ${finalPassNumber}. Type: ${trimmedVisitorType}. Host: ${trimmedHost} (${trimmedDept}).`},
            ${clientIp}
          )
        `;

        checkInData = {
          check_in_time: checkInResult[0]?.check_in_time || new Date().toISOString(),
          checked_in_by: guardName,
        };
      } catch (checkInErr) {
        console.error('Error in walk-in immediate check-in:', checkInErr);
      }
    }

    return NextResponse.json({
      success: true,
      passNumber: finalPassNumber,
      registrationCode: finalPassNumber,
      participantId,
      checkInData,
      message: checkInImmediately
        ? 'Visitor registered and checked in successfully.'
        : 'Visitor registration submitted in pending queue.',
    });
  } catch (error) {
    console.error('Walk-in registration error:', error);
    return NextResponse.json(
      { error: 'Walk-in registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
