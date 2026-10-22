import { NextRequest, NextResponse } from 'next/server';
import { sql, pool } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

function generateRegistrationCode(): string {
  const randomNum = Math.floor(Math.random() * 9000) + 1000;
  return `CTS-${randomNum}`;
}

async function getUniqueCode(): Promise<string> {
  let code = generateRegistrationCode();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const existing = await sql`
      SELECT registration_code FROM participants WHERE registration_code = ${code}
    `;
    if (existing.length === 0) {
      return code;
    }
    code = generateRegistrationCode();
    attempts++;
  }

  throw new Error('Could not generate unique registration code');
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      fullName,
      organisation,
      position,
      phone,
      hostName,
      department,
      visitPurpose,
      vehicleRegistration,
      isRecurring = false,
      checkInImmediately = false,
    } = body;

    // Validate input
    if (!fullName || !organisation || !position) {
      return NextResponse.json(
        { error: 'Full name, organisation, and position are required' },
        { status: 400 }
      );
    }

    const trimmedName = fullName.trim();
    const trimmedOrg = organisation.trim();
    const trimmedPos = position.trim();
    const trimmedHost = hostName?.trim() || '';
    const trimmedDept = department?.trim() || '';
    const trimmedPurpose = visitPurpose?.trim() || '';
    const trimmedVehicle = vehicleRegistration?.trim() || '';

    // Basic validation
    if (trimmedName.length < 2 || trimmedOrg.length < 2 || trimmedPos.length < 2) {
      return NextResponse.json(
        { error: 'Each field must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (/^\d+$/.test(trimmedName) || /^\d+$/.test(trimmedOrg) || /^\d+$/.test(trimmedPos)) {
      return NextResponse.json(
        { error: 'Numbers only are not allowed in any field' },
        { status: 400 }
      );
    }

    // Get first event or use NULL (no event required for walk-ins at PCC gate)
    let eventId: number | null = null;
    try {
      const eventRes = await sql`SELECT id FROM events LIMIT 1`;
      if (eventRes.length > 0) {
        eventId = eventRes[0].id;
      }
    } catch {
      // No events table entry — proceed without event association
    }

    // Generate unique registration code
    const registrationCode = await getUniqueCode();

    const hrUserId = parseInt((session.user as any).id);

    // Insert participant with all gate-relevant fields
    let result;
    if (checkInImmediately) {
      result = await sql`
        INSERT INTO participants (
          registration_code, full_name, organisation, position, phone,
          host_name, host_department, visit_purpose, vehicle_registration,
          is_recurring, event_id, registration_source,
          participant_status, registration_status, check_in_status, check_in_date, checked_in_by
        )
        VALUES (
          ${registrationCode}, ${trimmedName}, ${trimmedOrg}, ${trimmedPos}, ${phone || null},
          ${trimmedHost || null}, ${trimmedDept || null}, ${trimmedPurpose || null}, ${trimmedVehicle || null},
          ${isRecurring}, ${eventId}, 'WALK_IN',
          'REGISTERED', 'REGISTERED', 'CHECKED_IN', CURRENT_TIMESTAMP, ${hrUserId}
        )
        RETURNING id, registration_code
      `;
    } else {
      result = await sql`
        INSERT INTO participants (
          registration_code, full_name, organisation, position, phone,
          host_name, host_department, visit_purpose, vehicle_registration,
          is_recurring, event_id, registration_source,
          participant_status, registration_status, check_in_status
        )
        VALUES (
          ${registrationCode}, ${trimmedName}, ${trimmedOrg}, ${trimmedPos}, ${phone || null},
          ${trimmedHost || null}, ${trimmedDept || null}, ${trimmedPurpose || null}, ${trimmedVehicle || null},
          ${isRecurring}, ${eventId}, 'WALK_IN',
          'REGISTERED', 'REGISTERED', 'NOT_CHECKED_IN'
        )
        RETURNING id, registration_code
      `;
    }

    const participantId = result[0].id;
    let checkInData = null;

    if (checkInImmediately) {
      // Insert check_ins record
      try {
        const checkInResult = await sql`
          INSERT INTO check_ins (participant_id, user_id, check_in_time)
          VALUES (${participantId}, ${hrUserId}, NOW())
          ON CONFLICT (participant_id) DO NOTHING
          RETURNING id, check_in_time
        `;

        if (checkInResult.length > 0) {
          // Log audit entry
          const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
          const guardUser = await sql`SELECT name FROM users WHERE id = ${hrUserId}`;
          const guardDisplayName = guardUser[0]?.name || 'Security Officer';

          try {
            await sql`
              INSERT INTO visitor_logs (participant_id, action, user_id, details, ip_address)
              VALUES (
                ${participantId},
                'CHECK_IN',
                ${hrUserId},
                ${`Walk-in admin check-in by ${guardDisplayName}. Host: ${trimmedHost || 'N/A'} (${trimmedDept || 'N/A'}). Purpose: ${trimmedPurpose || 'N/A'}. Vehicle: ${trimmedVehicle || 'None'}.`},
                ${clientIp}
              )
            `;
          } catch (logErr) {
            console.warn('Failed to write visitor_log for walk-in admin check-in:', logErr);
          }

          checkInData = {
            check_in_time: checkInResult[0].check_in_time,
            checked_in_by: guardDisplayName,
          };
        }
      } catch (checkInError) {
        console.error('Error during immediate walk-in check-in:', checkInError);
        // Continue even if check-in fails — participant is registered
      }
    }

    return NextResponse.json({
      success: true,
      registrationCode: result[0].registration_code,
      participantId,
      checkInData,
    });
  } catch (error) {
    console.error('Walk-in registration error:', error);
    return NextResponse.json(
      { error: 'Walk-in registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
